import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill";
import { FaUndo, FaRedo, FaComment } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import "react-quill/dist/quill.snow.css";
import "./TextEditor.css";

function TextEditor() {
  const [value, setValue] = useState("");
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showRateSlider, setShowRateSlider] = useState(false);
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState("");
  const [isSelectedIsBold, setIsSelectedIsBold] = useState(false);
  const [addComment, setAddComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [edit, setEdit] = useState(false);
  const quillRef = useRef(null);

  const handleUndo = () => {
    quillRef.current.getEditor().history.undo();
  };

  const handleRedo = () => {
    quillRef.current.getEditor().history.redo();
  };

  const handleSelectionChange = (range, oldRange, source) => {
    if (range && range.length > 0) {
      const quill = quillRef.current.getEditor();
      const bounds = quill.getBounds(range);
      const selected = quill.getText(range.index, range.length);

      setToolbarPosition({
        top: bounds.top + 20,
        left: bounds.left + window.scrollX,
      });

      setSelectedText(selected);
      setIsSelectedIsBold(quill.getFormat().bold);
      setShowToolbar(true);
    } else {
      setIsSelectedIsBold(false);
      setShowToolbar(false);
    }
  };

  const handleRateChange = (e) => {
    const value = e.target.value;
    const quill = quillRef.current.getEditor();
    quill.formatText(quill.getSelection().index, quill.getSelection().length, {
      background: `rgba(${255 - value * 2.55}, ${value * 2.55}, 0, 0.5)`,
    });
  };

  const handleAddComment = ({ addNewComment, uid }) => {
    if (addNewComment === true && !uid) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const selected = quill.getText(range.index, range.length);

      quill.formatText(range.index, range.length, {
        background: "rgba(255, 255, 0, 0.4)",
      });
      const uid = range.index + selected + range.length;
      setAddComment({ uid, text: selected, comment: newComment, index: range.index, length: range.length, range });
    } else if (newComment && !uid) {
      let isExisting;
      const existingElement = comments.map((item) => {
        if (item.uid === addComment.uid) {
          isExisting = true;
          return { ...item, comment: newComment };
        }
        return item;
      });
      if (!isExisting) setComments([...comments, { ...addComment, comment: newComment }]);
      else setComments(existingElement);
      setNewComment("");
      setAddComment("");
    } else if (uid) {
      const existingElement = comments.map((item) => {
        if (item.uid === uid) {
          return { ...item, comment: newComment };
        }
        return item;
      });
      setComments(existingElement);
      setNewComment("");
      setAddComment("");
    }
  };

  const handleBold = () => {
    const editor = quillRef.current.getEditor();
    const isBold = editor.getFormat().bold;
    editor.format("bold", !isBold);
    setIsSelectedIsBold(!isBold);
  };
  const handleCommentClick = (comment) => {
    const quill = quillRef.current.getEditor();
    quill.setSelection(comment.index, comment.length);
    quill.formatText(comment.index, comment.length, {
      background: "rgba(255, 255, 0, 0.4)",
    });
  };

  const handleDelete = (id) => {
    const data = comments.filter((item) => item.uid != id);
    setComments(data);
  };

  const handleTextChange = (delta, oldDelta, source) => {
    const quill = quillRef.current.getEditor();
    const currentContent = quill.getContents();
    setComments((prevComments) =>
      prevComments.filter((comment) => {
        const commentText = quill.getText(comment.range.index, comment.range.length);
        return commentText.trim().length > 0;
      })
    );
  };

  useEffect(() => {
    const quill = quillRef.current.getEditor();
    quill.on("selection-change", handleSelectionChange);
    quill.on("text-change", handleTextChange);
    return () => {
      quill.off("selection-change", handleSelectionChange); // Cleanup
      quill.off("text-change", handleTextChange);
    };
  }, []);

  return (
    <div className="editor-container m-2">
      <div className="row">
        <div className="col-md-2"></div>
        <div className="col-12 col-md-7 h-100">
          <div className="custom-editor">
            <div className="toolBar-btn-main">
              <button className="btn btn-primary me-2" onClick={handleUndo}>
                <FaUndo />
              </button>
              <button className="btn btn-primary" onClick={handleRedo}>
                <FaRedo />
              </button>
            </div>
            <ReactQuill ref={quillRef} theme="snow" value={value} onChange={setValue} modules={{ toolbar: false }} />
            {showToolbar && (
              <div className="custom-toolbar" style={{ top: `${toolbarPosition.top}px`, left: `${toolbarPosition.left}px` }}>
                <button className="btn btn-primary" onClick={() => handleBold()} style={{ fontWeight: isSelectedIsBold ? "bold" : "normal" }}>
                  B
                </button>

                <button className="btn btn-primary me-2 ms-2" onClick={() => setShowRateSlider(!showRateSlider)}>
                  Rate
                </button>
                {showRateSlider && <input type="range" min="0" max="100" onChange={handleRateChange} style={{ marginTop: "5px" }} />}

                <button className="btn btn-primary" onClick={() => handleAddComment({ addNewComment: true })}>
                  <FaComment />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-md-3">
          {comments.map((comment, idx) => (
            <>
              {edit === comment.uid ? (
                <div className="comment-sidebar d-flex flex-column">
                  <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="form-control mb-2" />
                  <div className="d-flex gap-2 align-self-end">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setNewComment("");
                        setAddComment(false);
                        setEdit(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleAddComment({ uid: comment.uid });
                        setEdit(false);
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="display-sidebar d-flex justify-content-between align-items-center">
                  <p onClick={() => handleCommentClick(comment)} className="text-comment p-3 rounded mb-2" key={idx}>
                    <strong>{comment.text}</strong>: {comment.comment}
                  </p>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEdit(comment.uid);
                        setNewComment(comment.comment);
                      }}
                    >
                      <MdEdit />
                    </button>
                    <button className="btn btn-danger me-2" onClick={() => handleDelete(comment.uid)}>
                      <MdDelete />
                    </button>
                  </div>
                </div>
              )}
            </>
          ))}
          {addComment && (
            <div className="comment-sidebar d-flex flex-column align-items-center">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="form-control mb-2" />
              <div className="d-flex gap-2 align-self-end">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setNewComment("");
                    setAddComment(false);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddComment}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TextEditor;
