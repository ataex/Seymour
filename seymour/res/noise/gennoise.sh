#!/bin/bash
for i in $(seq 0 9)
do
   magick convert -size 256x256 xc: +noise Random -channel green -separate random$i.jpg
done