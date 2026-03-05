import httpx
import json

BASE_URL = "http://localhost:8000/api/v1/ai"

def test_chat():
    print("Testing /chat...")
    payload = {
        "step": "date",
        "region": "山东省",
        "city": "泰安市",
        "spot_name": "泰山"
    }
    try:
        response = httpx.post(f"{BASE_URL}/chat", json=payload)
        if response.status_code == 200:
            print("Chat Response:", response.json())
        else:
            print("Chat Failed:", response.status_code, response.text)
    except Exception as e:
        print("Chat Error:", e)

def test_resolve_location():
    print("\nTesting /resolve_location...")
    payloads = [
        {"location_input": "宽窄巷子", "region_context": "四川省"},
        {"location_input": "成都市", "region_context": "四川省"},
        {"location_input": "泰山", "region_context": "山东省"}
    ]
    
    for p in payloads:
        print(f"\nInput: {p['location_input']}")
        try:
            response = httpx.post(f"{BASE_URL}/resolve_location", json=p, timeout=30.0)
            if response.status_code == 200:
                print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
            else:
                print("Failed:", response.status_code, response.text)
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    test_chat()
    test_resolve_location()
