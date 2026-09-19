from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, ga, user, facility, cleaner, contractor, task, report

origins = ['*']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], #allow specific http methods (like post request, only get)
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(cleaner.router)
app.include_router(facility.router)
app.include_router(contractor.router)
app.include_router(task.router)
app.include_router(report.router)
app.include_router(ga.router)

@app.get("/")
async def root():
    return {"message": "eBersih API"}