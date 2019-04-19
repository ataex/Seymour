#!/bin/bash
for i in $(seq 0 399)
do
   convert -size 512x512 xc: +noise Random -channel green -separate random$i.jpg
done