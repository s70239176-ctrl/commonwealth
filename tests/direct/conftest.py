"""Shared helpers for Commonwealth Direct Mode tests."""
import json
import sys
from datetime import datetime, timedelta, timezone

import pytest

CONTRACT = "contracts/commonwealth.py"
MODULE = "_contract_commonwealth"
T0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
NOW0 = int(T0.timestamp())
EPOCH = 100
SEASON = 8
BOND = 100
CHARTER = (
    "Wood, stone and grain can be gathered from the land: one gather action yields at most 5 of one resource, halved in winter "
    "and during a drought. Coin cannot be gathered, minted or found. Nothing can be conjured."
)


def iso(offset_seconds: int = 0) -> str:
    return (T0 + timedelta(seconds=offset_seconds)).isoformat().replace("+00:00", "Z")


def set_clock(vm, seconds: int) -> None:
    """gltest 0.29.2's vm.warp() does not update gl.message_raw["datetime"]; update both."""
    vm.warp(iso(seconds))
    gl = sys.modules.get("genlayer.gl")
    if gl is not None and getattr(gl, "message_raw", None) is not None:
        gl.message_raw["datetime"] = iso(seconds)


def hexof(addr) -> str:
    if isinstance(addr, (bytes, bytearray)):
        return "0x" + bytes(addr).hex()
    if hasattr(addr, "as_hex"):
        return addr.as_hex.lower()
    return str(addr).lower()


def row(ok=True, **deltas):
    base = {"ok": ok, "wood": 0, "stone": 0, "grain": 0, "coin": 0}
    base.update(deltas)
    return base


def module():
    return sys.modules[MODULE]


@pytest.fixture
def world(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    direct_vm.strict_mocks = True
    for a in (direct_alice, direct_bob, direct_charlie):
        direct_vm.deal(a, 10**9)
    transfers, prompts = [], []

    def hook(vm, request):
        if "PostMessage" in request:
            m = request["PostMessage"]
            transfers.append({"to": hexof(m["address"]), "value": int(m["value"])})
            return {"ok": None}
        if "EthSend" in request:
            m = request["EthSend"]
            transfers.append({"to": hexof(m["address"]), "value": int(m["value"])})
            return {"ok": None}
        return None

    direct_vm._gl_call_hook = hook
    real = direct_vm._match_llm_mock

    def spy(prompt):
        prompts.append(prompt)
        return real(prompt)

    direct_vm._match_llm_mock = spy
    contract = direct_deploy(CONTRACT, CHARTER, EPOCH, SEASON, BOND)
    set_clock(direct_vm, 0)

    class W:
        vm = direct_vm
        c = contract
        alice, bob, charlie = direct_alice, direct_bob, direct_charlie
        sent = transfers
        llm_prompts = prompts
        deposited = 0

        @classmethod
        def join(cls, who, name="Ada", value=BOND):
            direct_vm.sender = who
            direct_vm.value = value
            res = contract.register(name)
            direct_vm.value = 0
            cls.deposited += value
            return res

        @staticmethod
        def jury(results):
            direct_vm.clear_mocks()
            direct_vm.mock_llm(r"COMMONWEALTH_JUDGE", results if isinstance(results, str) else json.dumps({"results": results}))

        @classmethod
        def act(cls, who, actions, results):
            cls.jury(results)
            direct_vm.sender = who
            return contract.act(actions)

        @staticmethod
        def at(seconds):
            set_clock(direct_vm, seconds)

        @classmethod
        def end_epoch(cls, sender=None):
            cls.at(cls.next_due())
            direct_vm.sender = sender or direct_charlie
            return contract.end_epoch()

        @classmethod
        def next_due(cls):
            return contract.get_world()["next_epoch_at"] - NOW0

        @classmethod
        def get(cls, who):
            return contract.get_citizen(hexof(who))

        @classmethod
        def paid_to(cls, who):
            return sum(t["value"] for t in transfers if t["to"] == hexof(who))

        @classmethod
        def total_paid(cls):
            return sum(t["value"] for t in transfers)

        @classmethod
        def run_to_end(cls, feed=()):
            """End every remaining epoch. Citizens in `feed` gather grain each epoch so they are never hungry."""
            while contract.get_world()["status"] == "RUNNING":
                for who in feed:
                    if cls.get(who).get("alive"):
                        try:
                            cls.act(who, ["gather grain"], [row(grain=5)])
                        except Exception:
                            pass  # already acted this epoch
                cls.end_epoch()

    return W
