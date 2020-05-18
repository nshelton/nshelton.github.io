
import os
import shutil
import pathlib
from PIL import Image
import PIL

DIRECTORY = "./fractalpathtracing"
MAX_WIDTH = 800
staticDirs = [x[0] for x in os.walk(DIRECTORY)]

toDelete = []

for dir in staticDirs:
    files = os.listdir(dir)
    for filePath in files:
        filePath = dir + "/" + filePath
        if "png" in filePath or  "jpg" in filePath:
            print(filePath)
            im1 = Image.open(filePath)
            print( im1.size)
            scale = MAX_WIDTH / im1.size[0]
            im1 = im1.resize((int(scale * im1.size[0]), int(scale * im1.size[1]) ), PIL.Image.LANCZOS)

        if "png" in filePath:
            newFilePath = filePath.replace( "png", "jpg")

            background = Image.new("RGB", im1.size, (255, 255, 255))
            background.paste(im1)  

            background.save(newFilePath, 'JPEG', quality=80)
        if "jpg" in filePath:
            print("jpg", im1.size)
            im1.save(filePath, 'JPEG', quality=80)

