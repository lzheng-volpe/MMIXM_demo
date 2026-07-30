from Class.port import airport as a
import xml.etree.ElementTree as ET

def Read_MMIXM(XML): 
    port = a() 
    tree = ET.parse(XML) 
    root = tree.getroot() 

    ns = { 
        'mb': 'https://mmixm.aero/base/4', 
        'mx': 'https://mmixm.aero/features/4' 
    } 
    
    def get_text(xpath): 
        node = root.find(xpath, ns) 
        return node.text if node is not None else None 
        
    def get_attr(xpath, attr_name): 
        node = root.find(xpath, ns) 
        return node.attrib.get(attr_name) if node is not None else None 

    port.setIATA(get_text('.//mb:identifier')) 
    
    port.setAvailability(get_text('.//mx:currentAvailability')) 
    
    port.setMonitored(get_text('.//mx:monitored')) 
    
    port.setTemp(float(get_attr('.//mx:parameterState/mx:currentValue', 'value')))
    
    return port