
import os
from ebooklib import epub
from typing import List
from models import Chapter

def generate_epub(title: str, author: str, chapters: List[Chapter], out_dir: str) -> str:
    book = epub.EpubBook()
    book.set_identifier('novel-translation')
    book.set_title(title)
    if author:
        book.add_author(author)

    epub_chapters = []
    for ch in chapters:
        h = epub.EpubHtml(title=ch.title or f"Chapter {ch.order}", file_name=f"chap_{ch.order}.xhtml", lang="en")
        body = (ch.translated_text or ch.source_text or "").replace("\n", "<br/>")
        h.content = f"<h1>{h.title}</h1><div>{body}</div>"
        book.add_item(h)
        epub_chapters.append(h)

    # TOC and spine
    book.toc = tuple(epub_chapters)
    book.spine = ['nav'] + epub_chapters
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # CSS
    style = 'BODY { font-family: serif; } h1 { margin: 1em 0; }'
    nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
    book.add_item(nav_css)

    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{title.replace(' ', '_')}.epub")
    epub.write_epub(out_path, book, {})
    return out_path
