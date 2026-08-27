import re

COMMON_AREA = [
    "kafetaria", "koridor", "awam", "lobi", "tandas", "toilet", "foyer", 
    "washroom", "tangga", "stair", "parking", "parkir", "ruang menunggu", 
    "waiting area", "gim", "gym", "gimnasium", "surau", "masjid", 
    "perpustakaan", "library", "pos keselamatan", "guard house", 
    "guard post", "lif", "lift", "legar", "persalinan",
    "corridor", "lobby", "restroom", "w.c", "mandi", "wuduk", "staircase", 
    "letak kereta", "balkoni", "balcony", "waiting", "anjung", "security", 
    "pondok pengawal", "grandstand", "taman", "padang", "gerai", "kedai", 
    "cafe", "canteen", "kantin", "dewan makan", "medan selera", "ruang makan", 
    "pejabat am", "general office", "kaunter", "counter", "elevator", 
    "laluan", "passage", "ruang penunggu", "ruang legar", "perhentian bas", 
    "bus stop", "ramp", "void", "living area", "lounge", "rehat", "gelanggang", 
    "indoor games", "bacaan umum", "rak majalah"
]

LIMITED_COMMON = [
    "galeri", "audio", "pemberita", "pejabat", "office", "bilik pejabat", 
    "pusat pelajar", "student centre", "bilik mesyuarat", "meeting room", 
    "dewan kuliah", "lecture hall", "bilik kuliah", "classroom", "seminar", 
    "makmal komputer", "computer lab", "studio", "bilik kostum", "pantri", 
    "pantry", "dapur", "taklimat", "BK", "LT", "Theatre", "Teater"
]

AUTHORISED = [
    "CCTV", "pendaftar", "HR", "Setiausaha", "Canselor", "DYMM", "Pengerusi", 
    "duct", "elektrik", "transformer", "tangki", "setor", "asrama", "hostel", 
    "bilik tidur", "tidur", "dorm", "makmal penyelidikan", "research lab", 
    "bilik kebal", "vault", "bilik riser", "riser", "server", "server room", 
    "bilik mayat", "mortuary", "bilik rawatan", "treatment room", 
    "bilik siasatan", "investigation", "rumah staf", "staff house", "stor", 
    "store", "storage", "Ketua", "Timb", "Pen.", "Koordinator",
    "bedroom", "rumah", "quarters", "resident", "research", "penyelidik", 
    "safe room", "strong room", "fail", "archive", "arkib", "simpanan", 
    "thesis", "pelayan", "kabel", "suis", "switch", "substation", "AHU", 
    "plant", "mekanikal", "pump", "bateri", "tech", "tank", 
    "pemprosesan data", "treatment", "bumbung", "roof", "telekomunikasi", 
    "telefon", "tel.", "genset", "compressor", "maintenance", 
    "penyelenggaraan", "exhaust", "loji", "kumbahan", "D.B", "distribution", 
    "kawalan", "control room", "penyediaan", "preparation", "bengkel", 
    "workshop", "refuse", "chamber", "salur pancur", "imhoof", "chiller", 
    "house keeping", "servis", "utility", "uitiliti", "catladder", 
    "autoclave", "animal house", "pengeringan", "pensyarah"
]

def normalize(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def classify_room(room_name):
    room = normalize(room_name)

    for kw in AUTHORISED:
        if kw in room:
            return "Authorised Personal Area"

    for kw in LIMITED_COMMON:
        if kw in room:
            return "Limited Common Area"

    for kw in COMMON_AREA:
        if kw in room:
            return "Common Area"

    return None