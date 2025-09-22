for i in ./assets/**/*.png; do
    cwebp -lossless "$i" -q 100 -o "${i:r}.webp"
    rm "$i";
done