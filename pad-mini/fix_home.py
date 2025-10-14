#!/usr/bin/env python3

with open('src/screens/HomeScreen.js', 'r') as f:
    content = f.read()

# Fix broken placeholder references
fixed_content = content.replace('color: theme.colors.placeho\nlder,', 'color: theme.colors.placeholder,')
fixed_content = fixed_content.replace('color: theme.colors.placeho\rlder,', 'color: theme.colors.placeholder,')

# Clean up any remaining broken lines
lines = fixed_content.split('\n')
cleaned_lines = []
skip_next = False

for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue
    
    if 'placeho' in line and 'placeholder' not in line:
        # This is a broken line, replace it
        cleaned_lines.append('    color: theme.colors.placeholder,')
        # Check if next line is just 'lder,' and skip it
        if i + 1 < len(lines) and 'lder,' in lines[i + 1]:
            skip_next = True
    else:
        cleaned_lines.append(line.rstrip())

with open('src/screens/HomeScreen.js', 'w') as f:
    f.write('\n'.join(cleaned_lines))

print("Fixed HomeScreen.js")