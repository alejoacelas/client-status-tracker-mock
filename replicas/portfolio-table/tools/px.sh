#!/bin/bash
# Print hex colour of pixel(s): px.sh image x y [x y ...]
img=$1; shift
while [ $# -gt 1 ]; do
  x=$1; y=$2; shift 2
  printf "%s,%s " $x $y
  ffmpeg -loglevel error -i "$img" -vf "crop=1:1:$x:$y,format=rgb24" -f rawvideo - | xxd -p
done
