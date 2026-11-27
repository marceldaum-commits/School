#!/usr/bin/env bash
# Entfernt die am 17.11.2026 versehentlich hochgeladenen Bau-Dateien (früheres Stimmmodell 63 MB u. a.) aus der Git-Geschichte.
# Inhalt aller Branches bleibt bit-gleich; nur diese Dateien verschwinden aus älteren Commits.
# Aufruf auf einem Rechner mit GitHub-Schreibrecht (eigenes Konto):  bash tools/git-bereinigung.sh
# Braucht: git, python3 (pip install git-filter-repo). Danach müssen alle anderen Kopien neu geholt werden (git fetch + reset, kein pull).
set -euo pipefail
REPO=https://github.com/marceldaum-commits/School
W=$(mktemp -d); cd "$W"
python3 -m pip install --quiet --user git-filter-repo
FR=$(python3 -c "import shutil,site,os; print(shutil.which('git-filter-repo') or os.path.join(site.USER_BASE,'bin','git-filter-repo'))")
git clone --quiet --mirror "$REPO" repo.git && cd repo.git && git config --unset remote.origin.mirror
BAD=3fc9cdb1d008e79bead14204e0cffb8b9818f022          # Commit mit den versehentlichen Dateien (Rechenblitz 3.25.0)
REFS=""; for r in $(git for-each-ref --format='%(refname)' refs/heads refs/tags); do git merge-base --is-ancestor $BAD $r 2>/dev/null && REFS="$REFS $r"; done
echo "Betroffen:$REFS"; [ -n "$REFS" ] || { echo "Nichts zu tun – schon bereinigt."; exit 0; }
for r in $REFS; do echo "$r $(git rev-parse $r)"; done > ../vorher.txt
"$FR" --invert-paths --path stimme/build/paket/ --path stimme/build/sprechtexte.txt --path stimme/build/woerter.txt --refs $REFS --force
# Prüfung: App-Ordner jedes Stands unverändert
while read r old; do [ "$(git rev-parse $old:kopfrechnen)" = "$(git rev-parse $r:kopfrechnen)" ] || { echo "ABBRUCH: $r verändert"; exit 1; }; done < ../vorher.txt
echo "Prüfung ok – lade hoch …"
args=""; while read r old; do args="$args --force-with-lease=$r:$old $r:$r"; done < ../vorher.txt
git push origin $args
echo "Fertig. Größte verbleibende Datei:"; git rev-list --objects $REFS | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' | awk '$1=="blob"' | sort -k2 -n -r | head -1
