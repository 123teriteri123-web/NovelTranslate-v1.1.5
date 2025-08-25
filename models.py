
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Novel(db.Model):
    __tablename__ = "novels"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    chapters = db.relationship("Chapter", backref="novel", cascade="all, delete-orphan", order_by="Chapter.order")

    def __repr__(self):
        return f"<Novel {self.id} {self.title!r}>"

class Chapter(db.Model):
    __tablename__ = "chapters"
    id = db.Column(db.Integer, primary_key=True)
    novel_id = db.Column(db.Integer, db.ForeignKey("novels.id"), nullable=False, index=True)
    order = db.Column(db.Integer, nullable=False, index=True)
    title = db.Column(db.String(256), nullable=True)
    source_text = db.Column(db.Text, nullable=False)
    translated_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    translated_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (db.UniqueConstraint('novel_id', 'order', name='uniq_novel_chapter_order'),)

    def __repr__(self):
        return f"<Chapter n={self.novel_id} #{self.order} {self.title!r}>"
