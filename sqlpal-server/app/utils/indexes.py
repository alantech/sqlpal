import logging
import os
from flask import session
from langchain import FAISS
from sqlalchemy import Column, Integer, LargeBinary, String
from sqlalchemy.orm import Session
from langchain.vectorstores import Chroma
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger(__name__)

Base = declarative_base()


class IndexContent(Base):
    __tablename__ = 'index_content'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    content = Column(LargeBinary)


def select_index():
    if os.environ.get('INDEX_ENGINE') == 'FAISS':
        index_engine = FaissEngine()
    elif os.environ.get('INDEX_ENGINE') == 'CHROMA':
        index_engine = ChromaEngine()
    else:
        index_engine = FaissEngine()
    return index_engine


class IndexEngine:
    def __init__(self):
        self.index_folder = os.environ.get('INDEX_FOLDER', '/tmp/indexes')

    def retrieve_index(self, db, filename):
        content = None
        if os.environ.get('USE_DATABASE'):
            try:
                sess = Session(bind=db._engine)
                row = sess.query(IndexContent).filter_by(
                    name=session['conn_str']).first()
                if row:
                    content = row.content
            except Exception as e:
                logger.exception(e)

            if content is not None:
                # write to local file
                filepath = os.path.join(self.index_folder, filename)
                with open(filepath, 'wb') as f:
                    f.write(content)

    def save_to_db(self, db, filepath):
        if os.environ.get('USE_DATABASE'):
            content = None
            try:
                with open(filepath, 'rb') as f:
                    content = f.read()
            except Exception as e:
                logger.exception(e)

            if content is not None:
                sess = Session(bind=db._engine)
                new_file = IndexContent(
                    name=session['conn_str'], content=content)
                sess.add(new_file)
                sess.commit()


class FaissEngine(IndexEngine):
    def read_index(self, db, embeddings):
        filename = "index_{}".format(session['conn_str'])
        self.retrieve_index(db, filename)

        # now read as usual from a file
        try:
            docsearch = FAISS.load_local(
                self.index_folder, embeddings, filename)
        except Exception as e:
            logger.exception(e)
            docsearch = None

        return docsearch

    def write_index(self, db, docsearch):
        filename = "index_{}".format(session['conn_str'])
        filepath = os.path.join(self.index_folder, filename)
        docsearch.save_local(self.index_folder, filename)
        self.save_to_db(db, filepath)

    def read_index_contents(self, texts, embeddings):
        docsearch = FAISS.from_texts(texts, embeddings)
        return docsearch


class ChromaEngine(IndexEngine):
    def read_index(self, db, embeddings):
        filename = "index_{}".format(session['conn_str'])
        self.retrieve_index(db, filename)

        # now read as usual from a file
        try:
            vectordb = Chroma(persist_directory=self.index_folder,
                              embedding_function=embeddings,
                              collection_name=filename)
        except:
            vectordb = None

        return vectordb

    def write_index(self, db, vectordb):
        vectordb.persist()
        filename = "index_{}".format(session['conn_str'])
        filepath = os.path.join(self.index_folder, filename)
        self.save_to_db(db, filepath)

    def read_index_contents(self, texts, embeddings):
        filename = "index_{}".format(session['conn_str'])

        vectordb = Chroma.from_texts(
            texts=texts, embedding=embeddings, persist_directory=self.index_folder, collection_name=filename)
        return vectordb
