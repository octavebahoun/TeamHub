from app.gemini import _parse_json


def test_parse_plain_and_fenced_json():
    assert _parse_json('{"headline": "ok"}') == {"headline": "ok"}
    assert _parse_json('```json\n{"headline": "ok"}\n```') == {"headline": "ok"}
    assert _parse_json("not json") is None
    assert _parse_json("") is None
    assert _parse_json("[1, 2]") is None
