from sqlalchemy.orm import Session
from .. import models
from bs4 import BeautifulSoup
import requests
import re
import collections
from ..config import database
from .classify_room import classify_room


headers = {
    'Content-Type': 'text/html; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'Referer': 'https://fms.uitm.edu.my/eruang/ruang_staff2/' 
}

def scraper():
    db: Session = database.SessionLocal()
    i = 0
    try:
        url = 'https://fms.uitm.edu.my/eruang/ruang_staff2/ajax_filtering_staff.php?class=getNegeri&state_default='

        http_session = requests.Session()
        response = http_session.get(url, headers=headers)
        soup = BeautifulSoup(response.text, "lxml")

        states = soup.find_all("option")
        for state in states:
            state_str = state.get_text(strip=True)
            if state_str != "-Sila Pilih-":
                state_split = state_str.split("-")
                stateCode = state_split[0].strip()
                stateName = state_split[1].strip()

                # A - Perak
                url2 = f'https://fms.uitm.edu.my/eruang/ruang_staff2/ajax_filtering_staff.php?class=getKampus&id_negeri={stateCode}'
                response2 = http_session.get(url2, headers=headers)
                soup2 = BeautifulSoup(response2.text, "lxml")

                campuses = soup2.find_all("option")
                for campus in campuses:
                    campus_str = campus.get_text(strip=True)
                    if campus_str != "-Sila Pilih-":
                        campus_split = campus_str.split("-")
                        campusCode = campus_split[0].strip()
                        campusName = campus_split[1].strip()

                        # new_campus = models.Campus(CampusCode=campusCode, CampusName=campusName, State=stateCode)
                        # db.add(new_campus)
                        # db.commit()
                        # db.refresh(new_campus)

                        if campusCode != "B01": continue

                        # A1 - Kampus Seri Iskandar
                        url3 = f'https://fms.uitm.edu.my/eruang/ruang_staff2/ajax_filtering_staff.php?class=getBangunan&id_negeri={stateCode}&id_kampus={campusCode}'
                        response3 = http_session.get(url3, headers=headers)
                        soup3 = BeautifulSoup(response3.text, "lxml")

                        buildings = soup3.find_all("option")
                        for building in buildings:
                            building_str = building.get_text(strip=True)
                            if building_str != "-Sila Pilih-":
                                building_split = building_str.split("-")
                                buildingCode = building_split[0].strip()
                                buildingName = building_split[1].strip()

                                new_building = models.Building(BuildingCode=buildingCode, BuildingName=buildingName, CampusCode=campusCode)
                                db.add(new_building)
                                db.flush()

                                url4 = f'https://fms.uitm.edu.my/eruang/ruang_staff2/ajax_filtering_staff.php?class=getBlok&id_negeri={stateCode}&id_kampus={campusCode}&id_bldg={buildingCode}'
                                response4 = http_session.get(url4, headers=headers)
                                soup4 = BeautifulSoup(response4.text, "lxml")

                                blocks = soup4.find_all("option")
                                for block in blocks:
                                    block_str = block.get_text(strip=True)
                                    if block_str != "-Sila Pilih-":
                                        block_split = block_str.split("-")
                                        blockCode = block_split[0].strip()
                                        blockName = block_split[1].strip()

                                        new_block = models.Block(BlockCode=blockCode, BlockName=blockName, BuildingID=new_building.BuildingID)
                                        db.add(new_block)
                                        db.flush()

                                        url5 = f'https://fms.uitm.edu.my/eruang/ruang_staff2/ajax_filtering_staff.php?class=getAras&id_negeri={stateCode}&id_kampus={campusCode}&id_bldg={buildingCode}&id_bl={blockCode}'
                                        response5 = http_session.get(url5, headers=headers)
                                        soup5 = BeautifulSoup(response5.text, "lxml")

                                        floors = soup5.find_all("option")
                                        for floor in floors:
                                            floor_str = floor.get_text(strip=True)
                                            if floor_str != "-Sila Pilih-":
                                                floor_split = floor_str.split("-")
                                                floorCode = floor_split[0].strip()
                                                floorName = floor_split[1].strip()

                                                new_floor = models.Floor(FloorCode=floorCode, FloorName=floorName, BlockID=new_block.BlockID)
                                                db.add(new_floor)
                                                db.flush()

                                                url6 = f'https://fms.uitm.edu.my/eruang/ruang_staff2/ajax_filtering_staff.php?class=getRuang&id_negeri={stateCode}&id_kampus={campusCode}&id_bldg={buildingCode}&id_bl={blockCode}&id_FL={floorCode}'
                                                response6 = http_session.get(url6, headers=headers)
                                                soup6 = BeautifulSoup(response6.text, "lxml")

                                                rooms = soup6.find_all("option")
                                                for room in rooms:
                                                    room_str = room.get_text(strip=True)
                                                    if room_str != "-Sila Pilih-":
                                                        room_split = room_str.split("-")
                                                        roomCode = room_split[0].strip()
                                                        roomName = room_split[1].strip()


                                                        url7 = f'https://fms.uitm.edu.my/eruang/ajax_space.php?id_space={roomCode}'
                                                        response7 = http_session.get(url7, headers=headers, timeout=30)

                                                        room_data = {}
                                                        try:
                                                            if response7.ok and response7.text.strip():
                                                                room_data = response7.json()
                                                        except ValueError:
                                                            room_data = {}

                                                        #   Room Name     STD     Description    EPU     Area
                                                        # ['Lobi Utama', '650B', 'Ruang Legar', '.00', '145.27']
                                                        room_description = room_data[2] if isinstance(room_data, list) and len(room_data) > 2 else None
                                                        room_epu = room_data[3] if isinstance(room_data, list) and len(room_data) > 3 else None
                                                        room_area = room_data[4] if isinstance(room_data, list) and len(room_data) > 4 else None

                                                        new_room = models.Room(RoomCode=roomCode, RoomName=roomName, RoomDescription=room_description, RoomType=classify_room(roomName), RoomArea=room_area, RoomEPU=room_epu, FloorID=new_floor.FloorID)
                                                        db.add(new_room)
                                        print(blockCode)    
                                db.commit()
                                                  
    finally:
        db.close()


if __name__ == "__main__":
    scraper()