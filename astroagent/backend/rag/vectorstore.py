"""
ChromaDB vector store for astrology knowledge base.
Run `python vectorstore.py` once to build the index from notes/*.txt
"""

import os
import chromadb
from chromadb.utils import embedding_functions

NOTES_DIR = os.path.join(os.path.dirname(__file__), "notes")
DB_PATH = os.path.join(os.path.dirname(__file__), "chroma_db")

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is not None:
        return _collection

    _client = chromadb.PersistentClient(path=DB_PATH)
    ef = embedding_functions.DefaultEmbeddingFunction()

    _collection = _client.get_or_create_collection(
        name="astrology_knowledge",
        embedding_function=ef,
    )
    return _collection


def build_index():
    """Index all .txt files in the notes/ directory."""
    col = _get_collection()

    if not os.path.exists(NOTES_DIR):
        print("No notes directory found, skipping index build.")
        return

    docs, ids, metas = [], [], []
    for i, fname in enumerate(os.listdir(NOTES_DIR)):
        if fname.endswith(".txt"):
            fpath = os.path.join(NOTES_DIR, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            # Chunk by paragraph
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            for j, para in enumerate(paragraphs):
                doc_id = f"{fname}_{j}"
                docs.append(para)
                ids.append(doc_id)
                metas.append({"source": fname, "chunk": j})

    if docs:
        col.upsert(documents=docs, ids=ids, metadatas=metas)
        print(f"Indexed {len(docs)} chunks from {NOTES_DIR}")
    else:
        print("No documents found to index.")


def query_knowledge_base(query: str, k: int = 4) -> list:
    col = _get_collection()
    try:
        results = col.query(query_texts=[query], n_results=k)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        return [{"content": d, "source": m.get("source", ""), "chunk": m.get("chunk", 0)}
                for d, m in zip(docs, metas)]
    except Exception:
        return []


if __name__ == "__main__":
    build_index()
    print("Knowledge base ready.")
