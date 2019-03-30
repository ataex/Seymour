#!/bin/bash
for i in $(seq 0 399)
do
   convert -size 1024x1024 xc: +noise Random -channel green -separate random$i.jpg
done