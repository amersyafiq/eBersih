from bs4 import BeautifulSoup
import requests


headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'Referer': 'https://fms.uitm.edu.my/eCMS/senarai_pemantauan.php?senarai_pemantauan.php&cari=1' 
}

form_data = {
    "negeri": "B",
    "kampus": "B01",
    "zone": "",
}

zones = ["FP1", "FP2", "KR", "PREMIER"]
building_by_zone = [
    {
        "zone": "FP1",
        "buildings": [],
    },
    {
        "zone": "FP2",
        "buildings": [],
    },
    {
        "zone": "KR",
        "buildings": [],
    },
    {
        "zone": "PREMIER",
        "buildings": [],
    },
]

def get_zones():
    url = 'https://fms.uitm.edu.my/eCMS/senarai_pemantauan.php?senarai_pemantauan.php&cari=1'

    buildingArr = []
    for zone in zones:
        form_data["zone"] = zone
        response = requests.post(url, headers=headers, data=form_data)
        soup = BeautifulSoup(response.text, 'html.parser')

        rows = soup.find_all("tr")
        zone_buildings = []
        for row in rows:
            building_name = row.select_one("td:nth-of-type(2)")
            if building_name:
                text = building_name.get_text(" ", strip=True)
                if text:
                    zone_buildings.append(text)

        unique = list(dict.fromkeys(zone_buildings))
        for item in building_by_zone:
            if item["zone"] == zone:
                item["buildings"] = unique
                break

    print(building_by_zone)

if __name__ == "__main__":
    get_zones()
