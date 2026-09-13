import uuid
from datetime import datetime

from app.database.db import get_conn, query_df

VALID_CATEGORIES = {"Evidence", "Finding", "Action Taken", "Note"}


def list_notes(complaint_id: str):
    return query_df(
        "SELECT * FROM investigation_notes WHERE complaint_id = ? ORDER BY created_at DESC",
        [complaint_id],
    )


def add_note(complaint_id: str, author: str, category: str, content: str):
    if category not in VALID_CATEGORIES:
        category = "Note"
    if not content or not content.strip():
        raise ValueError("Note content cannot be empty")

    note_id = f"NOTE-{uuid.uuid4().hex[:8].upper()}"
    conn = get_conn()
    conn.execute(
        "INSERT INTO investigation_notes (note_id, complaint_id, author, category, content, created_at) "
        "VALUES (?,?,?,?,?,?)",
        [note_id, complaint_id, author or "Investigator", category, content.strip(), datetime.utcnow().isoformat()],
    )
    conn.commit()
    conn.close()
    return {
        "note_id": note_id, "complaint_id": complaint_id, "author": author or "Investigator",
        "category": category, "content": content.strip(), "created_at": datetime.utcnow().isoformat(),
    }


def delete_note(note_id: str):
    conn = get_conn()
    conn.execute("DELETE FROM investigation_notes WHERE note_id = ?", [note_id])
    conn.commit()
    conn.close()
    return {"note_id": note_id, "deleted": True}
