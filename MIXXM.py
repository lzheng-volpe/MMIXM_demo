from datetime import datetime
from pydantic import BaseModel
from Utils.XML_Reader import Read_MMIXM 
from Class.port import airport 
from Airports.MMIXM_generation import generate_XML 
import csv 
import json
import asyncio 
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request 
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles 
from fastapi.templating import Jinja2Templates 
import folium 
from pathlib import Path 
import pandas as pd 

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(continuous_xml_generator())
    print("[Server Setup] Background XML simulation engine successfully mounted.")
    
    yield
    
    # This runs AUTOMATICALLY when you stop the server (Ctrl+C)
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("[Server Shutdown] Background task cleaned up safely.")

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static") 
templates = Jinja2Templates(directory="templates") 
xml_generation_active = True
airportDict = {} 

@app.get("/", response_class=HTMLResponse) 
def landing_page(request: Request): 
    return templates.TemplateResponse(request, "index.html")

airport_data = [] 
try: 
    with open('static\\filtered_dataset.csv', mode='r', encoding='utf-8') as file: 
        reader = csv.reader(file) 
        next(reader) 
        for row in reader: 
            if len(row) > 23: 
                airport_data.append({ 
                    "code": row[2].strip(), 
                    "name": row[3].strip(), 
                    "lat": row[18].strip(), 
                    "lon": row[23].strip() 
                }) 
except Exception as e: 
    print(f"Error loading CSV file: {e}") 

@app.get("/create", response_class=HTMLResponse) 
def create_airport(request: Request): 
    return templates.TemplateResponse(request, "create.html") 

@app.get("/api/search") 
def search_airports(q: str = ""): 
    query = q.lower().strip() 
    if not query: 
        return [] 
    matches = [ 
        airport for airport in airport_data 
        if query in airport["code"].lower() or query in airport["name"].lower() 
    ] 
    return matches[:10] 

@app.get("/Generate-All") 
def Generate_MMIXM_ALL(): 
    global airportDict 
    for i in airportDict: 
        generate_XML(airportDict[i]) 
    script_directory = Path(__file__).resolve().parent 
    folder_path = Path(f"{script_directory}\\static\\xml") 
    for items in folder_path.iterdir(): 
        update_airport(Read_MMIXM(items)) 
    return { 
        key: { 
            "temp": airportDict[key].getTemp(), 
            "moni": airportDict[key].getMonitored(), 
            "avail": airportDict[key].getAvailability(), 
            "color": airportDict[key].getColor() 
        } for key in airportDict 
    } 

def update_airport(airport: airport): 
    global airportDict 
    port = airportDict[airport.getIATA()] 
    port.setTemp(airport.getTemp()) 
    port.setMonitored(airport.getMonitored()) 
    port.setAvailability(airport.getAvailability()) 
    if airport.getAvailability() == "Partially Available": 
        port.setColor("orange") 
    elif airport.getAvailability() == "Unavailable": 
        port.setColor("red") 
    else: 
        port.setColor("green") 

@app.get("/map", response_class=HTMLResponse) 
def map_view(request: Request): 
    global airportDict 
    m = folium.Map(location=[42.3629, -71.0064], zoom_start=13) 
    script_directory = Path(__file__).resolve().parent 
    dataset = pd.read_csv(f"{script_directory}\\Airports\\Airports.csv", encoding="cp1252") 
    
    for i in range(len(dataset)): 
        ports = airport() 
        ports.setName(dataset.iloc[i, 1]) 
        ports.setIATA(dataset.iloc[i, 2]) 
        ports.setLat(dataset.iloc[i, 4]) 
        ports.setLong(dataset.iloc[i, 5]) 
        airportDict[ports.getIATA()] = ports 

    for key in airportDict: 
        html = f""" 
        <h4 onclick="parent.postMessage({{ type: 'OPEN_XML_SIDEBAR', iata: '{key}' }}, '*')" style="cursor:pointer; text-decoration: underline; color: #0066cc;"> {key} </h4> 
        <h2>{airportDict[key].getName()}</h2><br> 
        <span title = "How hot the internal sensor is for the radar."> Current Radar Temperature</span>: <span id="Temp-{key}">Loading...</span>°F<br> 
        <span title = "Current status from the airport to the Program"> Current Availability</span>: <span id="Avail-{key}">Loading...</span><br> 
        <span title = "If the airport is activity being monitored."> Monitored Status</span>: <span id="Moni-{key}">Loading...</span> 
        """ 
        divmarker = f""" 
        <div id="Marker-{key}" data-airport-code="{key}" style="font-size: 12px; color:#333;"> 
            <svg height="30" width="30"> 
                <circle class="marker-circle" cx="15" cy="15" r="10" stroke="gray" stroke-width="2" fill="gray" opacity="0.8" /> 
            </svg> 
        </div> 
        """ 
        folium.Marker( 
            location=[airportDict[key].getLat(), airportDict[key].getLong()], 
            tooltip=airportDict[key].getName(), 
            popup=folium.Popup(html, max_width=300), 
            icon=folium.DivIcon(icon_size=(30, 30), icon_anchor=(15, 15), html=divmarker), 
            options={"airportKey": str(key)} 
        ).add_to(m) 

    with open("static/map.js", "r", encoding="utf-8") as f: 
        map_javascript_code = f.read() 
    
    m.get_root().script.add_child(folium.Element(map_javascript_code)) 
    full_map_html = m.get_root().render() 
    return templates.TemplateResponse( 
        request, "map.html", {"full_map": full_map_html} 
    )

async def continuous_xml_generator():
    global airportDict, xml_generation_active
    while True:
        try:
            if xml_generation_active:
                for i in airportDict:
                    generate_XML(airportDict[i])
                print("[Simulation Engine] Fresh airport XML files generated successfully.")
        except Exception as e:
                print(f"[Simulation Engine] XML generation error: {e}")
                
        await asyncio.sleep(5)

@app.post("/toggle-xml-generation")
async def toggle_xml_generation():
    global xml_generation_active
    xml_generation_active = not xml_generation_active
    return JSONResponse(content={
        "status": "success", 
        "xml_generation_active": xml_generation_active
    })

@app.get("/stream-airport-data")
async def stream_airport_data():
    async def event_generator():
        global airportDict
        script_directory = Path(__file__).resolve().parent
        folder_path = Path(f"{script_directory}/static/xml")
        
        while True:
            if folder_path.exists():
                for items in folder_path.iterdir():
                    if items.is_file() and items.suffix.lower() == '.xml':
                        try:
                            update_airport(Read_MMIXM(items))
                        except Exception:
                            pass

            payload = {
                key: {
                    "temp": airportDict[key].getTemp(),
                    "moni": airportDict[key].getMonitored(),
                    "avail": airportDict[key].getAvailability()
                } for key in airportDict
            }
            
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

class MMIXMPayload(BaseModel):
    IATA: str
    Name: str
    Lat: float
    Long: float
    Temp: str
    Avail: str
    Moni: str

@app.post("/write_xml")
def write_MMIXM(payload: MMIXMPayload):
    xml_template = f"""<?xml version="1.0" encoding="UTF-8"?>
    <mb:Message xmlns:mb="https://mmixm.aero/base/4" 
                xmlns:mx="https://mmixm.aero/features/4" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                messageType="Service Monitoring" 
                id="String" 
                timestamp="{datetime.now().isoformat()}Z" 
                xsi:schemaLocation="https://mmixm.aero/4 https://mmixm.aero/4/mmixm.xsd">
        <mx:Asset>
            <mx:assetName>{payload.Name}</mx:assetName>
            <mx:location>
                <mb:faaLocation>
                    <mb:identifier>{payload.IATA}</mb:identifier>
                    <mb:type>
                        <mb:locationType>Airport</mb:locationType>
                    </mb:type>
                </mb:faaLocation>
                <mb:geographicLocation>
                    <mb:latitude>{payload.Lat}</mb:latitude>
                    <mb:longitude>{payload.Long}</mb:longitude>
                </mb:geographicLocation>
            </mx:location>
            <mx:monitoringEvent>
                <mx:eventDateTime>{datetime.now().isoformat()}</mx:eventDateTime>
                <mx:parameter>
                    <mx:availability>
                        <mx:currentAvailability>{payload.Avail}</mx:currentAvailability>
                    </mx:availability>
                    <mx:monitored>{payload.Moni}</mx:monitored>
                    <mx:name>System Temperature (internal sensor)</mx:name>
                    <mx:parameterState>
                        <mx:currentValue xsi:type="mb:Temperature" uom="F" value="{payload.Temp}"/>
                    </mx:parameterState>
                </mx:parameter>
            </mx:monitoringEvent>
        </mx:Asset>
    </mb:Message>"""
    
    return Response(content=xml_template)