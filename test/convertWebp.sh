for i in ./assets/**/*.png; do
    cwebp "$i" -lossless -mt -q 100 -quiet -o "${i:r}.webp"
    rm "$i";
done