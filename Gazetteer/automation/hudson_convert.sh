#!/bin/sh

cd $WORKSPACE

CC=$country
BASE=/home/dkiselev
JAR=/home/dkiselev/bin/gazetteer.jar

if [ -n "$dumpsrc" ]; then
    echo "download $CC from $ $dumpsrc"
    wget --no-verbose -O $BASE/dumps/$CC.osm.bz2 $dumpsrc
fi

echo "`date` START Convert $CC (Boundary: $boundary)"

echo "Create backup"
mv -f $BASE/out/$CC.json.gz $BASE/bak/$CC.json.gz

echo "`date` Split $CC"
bzcat $BASE/dumps/$CC.osm.bz2 | java -jar $JAR split - none

M="-Xmx"$mem"g"
if [[ "default" = "$mem" ]] || [[ -z $mem ]]; then
    M="-Xmx10g"
fi

bcc=$(grep "$boundary" $BASE/boundaries/$CC.csv | wc -l)
bca=$(grep "$boundary" $BASE/boundaries/Countries.csv | wc -l)
if [[ $bcc -lt 1 ]] && [[ -f $BASE/boundaries/Countries.csv ]] && [[ $bca -gt 0 ]]; then
    grep "$boundary" $BASE/boundaries/Countries.csv >> $BASE/boundaries/$CC.csv
    echo "Boundary $boundary taken from $BASE/boundaries/Countries.csv"
fi

echo "`date` Slice $CC (x10: $x10)"
X=""
if [ "$x10" = true ]; then
    X="--x10"
fi

java $M -jar $JAR --log-prefix $CC slice $X --boundaries-fallback-file $BASE/boundaries/$CC.csv

if [ $(grep "$boundary" $BASE/boundaries/$CC.csv | wc -l) -lt 1 ]; then
    echo "Boundary $boundary hasn't builded. Abort Join"
    cp -f $BASE/bak/$CC.json.gz $BASE/out/$CC.json.gz1
    exit 2
fi

echo "`date` Join $CC (Threads: $threads Boundary: $boundary) "

T="--threads $threads"
if [[ "$threads" = "auto" ]] || [[ -z $threads ]]; then
    T=""
fi

B="--check-boundaries $boundary"
if [ -z $boundary ]; then
    B=""
fi

java $M -jar $JAR --log-prefix $CC $T join --find-langs $B --handlers out-gazetteer out=$BASE/out/$CC.json.gz poi_catalog=$BASE/osm-doc/catalog/

if [ ! -f "$BASE/out/$CC.json.gz" ]; then
    echo "$BASE/out/$CC.json.gz not found"
    echo "`date` FAIL Convert $CC restore from bakup"
    cp -f $BASE/bak/$CC.json.gz $BASE/out/$CC.json.gz
    exit 1
fi

SIZE=$(stat -c '%s' $BASE/out/$CC.json.gz)
if [ $SIZE -lt 1024 ]; then
    echo "$BASE/out/$CC.json.gz is too small. Size: $SIZE kb"
    echo "`date` FAIL Convert $CC restore from bakup"
    cp -f $BASE/bak/$CC.json.gz $BASE/out/$CC.json.gz
    exit 1
fi

rm $BASE/bak/$CC.json.gz

if [ "$cleardump" = true ]
then
    echo "Remove osm dump"
    rm $BASE/dumps/$CC.osm.bz2
fi

echo "`date` DONE Convert $CC"

exit 0