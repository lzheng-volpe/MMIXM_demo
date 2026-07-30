from Utils import LimitRandom as lr
from Class import port

from lxml import etree
from datetime import datetime
from pathlib import Path
import os
import random

def addXMLchild(parent, tag, value):
    if value is not None:
        etree.SubElement(parent, tag).text = str(value)
        return True
    else:
        return False

def simulateAvailability():
    n = random.randint(1,100)

    if n > 10:
        return("Available")
    else:
        if n == 1:
            return("Unavailable")
        else:
            return("Partially Available")

def generate_XML(port = port.airport):
    Lat = port.getLat()
    Long = port.getLong()
    today = datetime.now().isoformat()

    Temp = lr.LimitRandFloat(130, -50, 5, port.getTemp())
    Avail = simulateAvailability()

    if Avail != "Unavailable":
        Moni = "Monitored"
    else:
        Moni = "Unmonitored"
    
    xml_template = f"""
    <?xml version="1.0" encoding="UTF-8"?>
    <mb:Message xmlns:mb="https://mmixm.aero/base/4" xmlns:mx="https://mmixm.aero/features/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" messageType="Service Monitoring" id="String" timestamp="2001-12-17T09:30:47Z" xsi:schemaLocation="https://mmixm.aero/4 https://mmixm.aero/4/mmixm.xsd">
        <mx:Asset>
            <mx:assetName>{port.getName()}</mx:assetName>
            <mx:location>
                <mb:faaLocation>
                    <mb:identifier>{port.getIATA()}</mb:identifier>
                    <mb:type>
                        <mb:locationType>Airport</mb:locationType>
                    </mb:type>
                </mb:faaLocation>
                <mb:geographicLocation>
                    <mb:latitude>{Lat}</mb:latitude>
                    <mb:longitude>{Long}</mb:longitude>
                </mb:geographicLocation>
            </mx:location>
            <mx:monitoringEvent>
                <mx:eventDateTime>{today}</mx:eventDateTime>
                <mx:parameter>
                    <mx:availability>
                        <mx:currentAvailability>{Avail}</mx:currentAvailability>
                    </mx:availability>
                    <mx:monitored>{Moni}</mx:monitored>
                    <mx:name>System Temperature (internal sensor)</mx:name>
                    <mx:parameterState>
                            <mx:currentValue xsi:type="mb:Temperature" uom="F" value="{Temp}"/>
                    </mx:parameterState>
                </mx:parameter>
            </mx:monitoringEvent>
        </mx:Asset>
    </mb:Message>
    """

    root = etree.fromstring(xml_template.strip().encode('utf-8'))
    script_directory = Path(__file__).resolve().parent.parent

    writepath = f"{script_directory}\\static\\xml"
    tree = etree.ElementTree(root)

    file_path = os.path.join(writepath, f"{port.getIATA()}.xml")
    os.makedirs(writepath, exist_ok=True)

    tree.write(file_path, 
        pretty_print=True, 
        xml_declaration=True, 
        encoding="utf-8"
    )