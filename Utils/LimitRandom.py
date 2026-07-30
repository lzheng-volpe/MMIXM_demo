import random
import numpy as np

def LimitRand(Max, Min, SD, Num = None):
    if Num is None:
        Num = random.randrange(Min, Max)
        
    move_down = min(SD, Num - Min)
    move_up = min(SD, Max - Num)
    x = random.randint(-move_down, move_up)
    return Num + x

def LimitRandFloat(Max, Min, SD, Num = None):
    if Num is None:
        Num = np.round(np.random.uniform(Min, Max), 1)
        
    move_down = min(float(SD), float(Num - Min))
    move_up = min(float(SD), float(Max - Num))
    x = np.round(np.random.uniform(-move_down, move_up), 1)
    return np.round(Num + x, 1)