from app.config import settings
from groq import Groq

client = Groq(api_key=settings.GROQ_API_KEY)
models = client.models.list()
for m in models.data:
    print(m.id)
