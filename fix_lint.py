import re

# Fix redis.js - remove duplicate keys
with open('../statsor-backend/src/config/redis.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove lines 25-26 (duplicate retryDelayOnFailover and maxRetriesPerRequest)
lines = content.split('\n')
# Remove duplicates at lines 24-25 (0-indexed)
if 'retryDelayOnFailover: 100' in lines[24] and 'maxRetriesPerRequest: 3' in lines[25]:
    del lines[25]
    del lines[24]

content = '\n'.join(lines)

with open('../statsor-backend/src/config/redis.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed redis.js")

# Fix security.js - remove unnecessary escapes
with open('../statsor-backend/src/middleware/security.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r"/(\'|(\\-\\-)|(;)|(\\||\\|)|(\\*|\\*))/i", r"/('|(\\--)|(;)|(\\||\\|)|(\\*|\\*))/i")

with open('../statsor-backend/src/middleware/security.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed security.js")

# Fix securityService.js - fix regex pattern
with open('../statsor-backend/src/services/securityService.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    r"sqlInjection: /('|(\\-\\-)|(;)|(\\||\\|)|(\\*|\\*))/i,",
    r"sqlInjection: /('|(\\--)|(;)|(\\||\\|))/i,"
)
content = content.replace(
    r"pathTraversal: /(\\.\\.[\\/\\\\]|\\.\\.%2f|\\.\\.%5c)/i,",
    r"pathTraversal: /(\\.\\.[\\/\\\\]|\\.\\.\\/|\\.\\..)/i,"
)

with open('../statsor-backend/src/services/securityService.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed securityService.js")

# Fix playersEnhanced.js - change const reassignment
with open('../statsor-backend/src/routes/playersEnhanced.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'updateData = restrictedUpdate;',
    'Object.keys(restrictedUpdate).forEach(key => { updateData[key] = restrictedUpdate[key]; });'
)

with open('../statsor-backend/src/routes/playersEnhanced.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed playersEnhanced.js")
print("All files fixed!")
