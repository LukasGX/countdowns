from datetime import date, datetime, time, timedelta
import secrets
from fastapi import Depends, FastAPI, Form, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import webuntis
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()
app.mount("/fe", StaticFiles(directory="app", html=True), name="app")

SECRET_KEY = os.getenv("SECRET_KEY")
VALID_PASSWORD = os.getenv("VALID_PASSWORD")
tokens = {}

security = HTTPBearer(auto_error=False)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token not in tokens.values():
        raise HTTPException(
            status_code=401,
            detail="Wrong Token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

@app.get("/")
async def root():
    return RedirectResponse("/fe", status_code=302)

def get_lesson(ttbl, now):
    current_time = now.time()
    
    for entry in ttbl:
        if not entry:
            continue
            
        start_time = entry.start.time()
        end_time = entry.end.time()
        
        if start_time <= current_time <= end_time:
            if entry.code == "cancelled":
                cancelled = True
            else:
                cancelled = False

            toReturn = {
                "cancelled": cancelled,
                "subject": entry.subjects[0].name,
                "subject_long": entry.subjects[0].long_name,
                "room_change": True if len(entry.original_rooms) >= 1 else False,
                "room": entry.rooms[0].name,
                "original_room": entry.original_rooms[0].name if len(entry.original_rooms) >= 1 else None,
                "substitution": True if len(entry.original_teachers) >= 1 else False,
                "teacher": entry.teachers[0].name,
                "original_teacher": entry.original_teachers[0].name if len(entry.original_teachers) >= 1 else None,
            }
            
            return toReturn
    
    return None

@app.get("/now")
async def now(token = Depends(verify_token)):
    s = webuntis.Session(
        server=os.getenv("UNTIS_SERVER"),
        username=os.getenv("UNTIS_USERNAME"),
        password=os.getenv("UNTIS_PASSWORD"),
        school=os.getenv("UNTIS_SCHOOL"),
        useragent='Countdowns'
    )

    s.login()

    now = datetime.now()
    today = date.today()

    ttbl = s.my_timetable(end=today, start=today)
    lesson = get_lesson(ttbl, now)

    if not lesson is None:
        return {"lesson": lesson, "authorized": True}
    else:
        return {"lesson": None, "authorized": True}
    
class AuthRequest(BaseModel):
    password: str
    
@app.post("/authorize")
async def authorize(request: AuthRequest):
    if request.password != VALID_PASSWORD:
        raise HTTPException(status_code=401, detail="Falsches Passwort")
    
    user_token = secrets.token_hex(32)
    tokens[request.password] = user_token
    
    return {"token": user_token, "expires": (datetime.now() + timedelta(hours=24)).isoformat()}

@app.get("/login")
async def login_page():
    return FileResponse("app/login.html")