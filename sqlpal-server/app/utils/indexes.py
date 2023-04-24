import logging
import os
from flask import session
from langchain import FAISS
from sqlalchemy.orm import Session
from . import FaissContent
from langchain.embeddings.openai import OpenAIEmbeddings

logger = logging.getLogger(__name__)


class IndexEngine:
    def __init__(self):
        pass

    def read_index(self, db):
        raise NotImplementedError

    def write_index(self, db, docsearch):
        raise NotImplementedError

    def read_index_contents(self, texts):
        raise NotImplementedError


class FaissEngine(IndexEngine):
    def read_index(self, db):
        filename = "index_{}".format(session['conn_str'])

        content = None
        if os.environ.get('USE_DATABASE'):
            try:
                sess = Session(bind=db._engine)
                row = sess.query(FaissContent).filter_by(
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

        # now read as usual from a file
        try:
            docsearch = FAISS.load_local(
                self.index_folder, self.embeddings, filename)
        except:
            docsearch = None

        return docsearch

    def write_index(self, db, docsearch):
        filename = "index_{}".format(session['conn_str'])
        filepath = os.path.join(self.index_folder, filename+'.pkl')
        docsearch.save_local(self.index_folder, filename)
        if os.environ.get('USE_DATABASE'):
            content = None
            try:
                with open(filepath, 'rb') as f:
                    content = f.read()
            except Exception as e:
                logger.exception(e)

            if content is not None:
                sess = Session(bind=db._engine)
                new_file = FaissContent(
                    name=session['conn_str'], content=content)
                sess.add(new_file)
                sess.commit()

    def read_index_contents(self, texts, embeddings):
        docsearch = FAISS.from_texts(texts, embeddings)
        return docsearch
