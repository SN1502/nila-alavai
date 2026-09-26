"""Turn a failed build log into GitHub error annotations, so the cause shows on the run page."""
import re
import sys


def emit(title, text):
    text = text.strip()[:3500].replace('%', '%25').replace('\r', '').replace('\n', '%0A')
    print(f'::error title={title}::{text}')


def main(path):
    try:
        with open(path, encoding='utf-8', errors='replace') as f:
            log = f.read()
    except FileNotFoundError:
        return
    gradle = re.search(r'\* What went wrong:(.*?)(\* Try:|\Z)', log, re.S)
    if gradle:
        emit('Build failed', gradle.group(1))
    else:
        emit('Build failed', log[-3000:])
    lines = [l for l in log.splitlines() if re.search(r'error:|ERROR|AAPT|⨯|Error:', l)][:25]
    if lines:
        emit('Error lines', '\n'.join(lines))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'build.log')
