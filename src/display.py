import json
import os
import time
from luma.core.interface.serial import i2c
from luma.oled.device import sh1106
from luma.core.render import canvas
from PIL import ImageFont

serial = i2c(port=1, address=0x3C)
device = sh1106(serial)

_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "trainTimes.json")

FONT_SIZE = 14
LINE_HEIGHT = FONT_SIZE + 4
DISPLAY_SECONDS = 5


def format_updated(time_recorded_ms):
    elapsed = int(time.time() - time_recorded_ms / 1000)
    if elapsed < 5:
        return "Updated just now"
    return f"Updated {elapsed}s ago"


def display():
    with open(_DATA_PATH) as f:
        data = json.load(f)

    font = ImageFont.truetype(_FONT_PATH, FONT_SIZE)

    fLine = "F: " + ", ".join(str(t) for t in data["F"])
    gLine = "G: " + ", ".join(str(t) for t in data["G"])
    timeLine = format_updated(data["timeRecorded"])

    with canvas(device) as draw:
        draw.text((0, 0), fLine, font=font, fill="white")
        draw.text((0, LINE_HEIGHT), gLine, font=font, fill="white")
        draw.text((0, LINE_HEIGHT * 2), timeLine, font=font, fill="white")

    time.sleep(DISPLAY_SECONDS)


if __name__ == "__main__":
    while True: 
        display()
