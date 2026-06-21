import asyncio
from app.services.ai_service import generate_all

async def main():
    try:
        papers = [{"title": "Sample Paper", "abstract": "This is a test abstract about machine learning."}]
        res = await generate_all("Machine Learning in Healthcare", papers)
        print("RESULT:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
