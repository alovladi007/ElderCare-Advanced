import httpx
import os
from typing import Dict, Any, List

HUB_URL = os.getenv("HUB_URL", "http://hub:9001")

async def list_devices() -> List[Dict[str, Any]]:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{HUB_URL}/devices")
        response.raise_for_status()
        return response.json()

async def get_device_state(device_id: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{HUB_URL}/devices/{device_id}")
        response.raise_for_status()
        return response.json()

async def send_command(device_id: str, command: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HUB_URL}/devices/{device_id}/commands",
            json={"command": command}
        )
        response.raise_for_status()
        return response.json()
