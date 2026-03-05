def test_records_crud_flow(client):
    payload = {
        "province": "浙江省",
        "city": "杭州市",
        "spot_name": "西湖",
        "travel_date": "2026-03-05",
        "weather": "sunny",
        "thoughts": "风景很好。",
        "images": [],
    }

    create_response = client.post("/api/v1/records/", json=payload)
    assert create_response.status_code == 200
    created = create_response.json()
    record_id = created["id"]
    assert created["province"] == payload["province"]
    assert created["city"] == payload["city"]

    list_response = client.get("/api/v1/records/")
    assert list_response.status_code == 200
    items = list_response.json()
    assert len(items) == 1
    assert items[0]["id"] == record_id

    update_payload = dict(payload)
    update_payload["thoughts"] = "重游西湖。"
    update_response = client.put(f"/api/v1/records/{record_id}", json=update_payload)
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["thoughts"] == "重游西湖。"

    delete_response = client.delete(f"/api/v1/records/{record_id}")
    assert delete_response.status_code == 200
    assert delete_response.json() == {"ok": True}

    list_after_delete = client.get("/api/v1/records/")
    assert list_after_delete.status_code == 200
    assert list_after_delete.json() == []
