import re

# Fix remaining regex errors in config/redis.js
with open('../statsor-backend/src/config/redis.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check for duplicate keys around line 50
output = []
seen_retry = False
seen_max = False
for i, line in enumerate(lines):
    # Skip duplicate retryDelayOnFailover and maxRetriesPerRequest in upstashConfig
    if i >= 42 and i <= 53:  # Around the upstashConfig section
        if 'retryDelayOnFailover: 100' in line and seen_retry:
            continue
        if 'maxRetriesPerRequest: 3' in line and seen_max:
            continue
        if 'retryDelayOnFailover' in line:
            seen_retry = True
        if 'maxRetriesPerRequest' in line:
            seen_max = True
    output.append(line)

with open('../statsor-backend/src/config/redis.js', 'w', encoding='utf-8') as f:
    f.writelines(output)

print("Fixed redis.js duplicates")

# Fix security.js regex
with open('../statsor-backend/src/middleware/security.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 155 - remove unnecessary escapes
content = re.sub(
    r"/\('?\|\(\\-\\-\)?\|\(;\)?\|\(\\\|\|\\\|\)?\|\(\\\*\|\\\*\)?\)/i",
    r"/('|(\\--)|(;)|(\\||\\|)|(\\*|\\*))/i",
    content
)

with open('../statsor-backend/src/middleware/security.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed security.js regex")

# Fix securityService.js
with open('../statsor-backend/src/services/securityService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the regex patterns
content = re.sub(
    r"sqlInjection: /\('?\|\(\\\\-\\\\-\)?\|\(;\)?\|\(\\\\\|\|\\\\\|\)?\|\(\\\\\*\|\\\\\*\)?\)/i,",
    r"sqlInjection: /('|(\\--)|(;)|(\\||\\|))/i,",
    content
)

content = re.sub(
    r"pathTraversal: /\(\\\\\.\\\\\.?\[\\\\/\\\\\\\\\]?\|\\\\\.\\\\\.?%2f?\|\\\\\.\\\\\.?%5c?\)/i,",
    r"pathTraversal: /(\\.\\.[\\/\\\\]|\\.\\.%2f|\\.\\.%5c)/i,",
    content
)

with open('../statsor-backend/src/services/securityService.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed securityService.js regex")

# Fix playersEnhanced.js const assignment
with open('../statsor-backend/src/routes/playersEnhanced.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '      \n      updateData = restrictedUpdate;',
    '      \n      Object.assign(updateData, restrictedUpdate);'
)

with open('../statsor-backend/src/routes/playersEnhanced.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed playersEnhanced.js const")
print("\nAll regex and const errors fixed!")
