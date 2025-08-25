
from typing import List
from models import Chapter

def build_markdown(chapters: List[Chapter]) -> str:
    parts = []
    for ch in chapters:
        title = ch.title or f"Chapter {ch.order}"
        body = ch.translated_text or ch.source_text or ""
        parts.append(f"# {title}\n\n{body}")
    return "\n\n---\n\n".join(parts)
