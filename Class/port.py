import folium

class airport:
    def __init__(self):
        self.__name = None
        self.__IATA = None
        self.__Latitude = 0
        self.__Longitude = 0
        self.__Tempature = 0
        self.__Monitored = "Monitored"
        self.__Availability = "Available"
        self.__Marker = None
        self.__Color = "green"

    def setName(self, name): self.__name = name
    def getName(self): return self.__name

    def setIATA(self, IATA): self.__IATA = IATA
    def getIATA(self): return self.__IATA

    def setLat(self, Lat): self.__Latitude = Lat
    def getLat(self): return self.__Latitude

    def setLong(self, Long): self.__Longitude = Long
    def getLong(self): return self.__Longitude

    def setTemp(self, Temp): self.__Tempature = Temp
    def getTemp(self): return self.__Tempature

    def setMonitored(self, Monitor): self.__Monitored = Monitor
    def getMonitored(self): return self.__Monitored

    def setAvailability(self, Available): self.__Availability = Available
    def getAvailability(self): return self.__Availability

    def setMarker(self, Marker): self.__Marker = Marker
    def getMarker(self): return self.__Marker
    
    def setColor(self, color): self.__Color = color
    def getColor(self): return self.__Color