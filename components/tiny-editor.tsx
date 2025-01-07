"use client";

import { Box, FormControlLabel } from "@bigcommerce/big-design";
import { theme } from "@bigcommerce/big-design-theme";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useState } from "react";

type EditorProps = {
  initialValue: string;
  isDisabled?: boolean;
  label: string;
  onChange?: (content: string) => void;
};

export default function Editor({
  initialValue,
  isDisabled = false,
  label,
  onChange = (newValue) => {},
}: EditorProps) {
  const [initialized, setInitialized] = useState(false);

  return (
    <>
      <FormControlLabel>{label}</FormControlLabel>
      <Box style={{ height: "300px" }}>
        {!initialized ? <Skeleton height={300} /> : <></>}
        <Box style={{ display: initialized ? "block" : "none" }}>
          <TinyMCEEditor
            aria-label={label}
            value={initialValue}
            onEditorChange={(newValue) => onChange(newValue)}
            onInit={(event, editor) => {
              setInitialized(true);

              if (isDisabled) {
                editor.mode.set("readonly");
              }
            }}
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            init={{
              height: 300,
              menubar: false,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "charmap",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "table",
                "preview",
                "wordcount",
                "codesample",
                "pagebreak",
              ],
              toolbar:
                "blocks fontfamily fontsize bullist numlist fullscreen |" +
                "outdent indent | alignleft aligncenter alignright alignjustify | bold italic underline |" +
                "table link codesample forecolor removeformat",
              content_style: `body { font-family:Source Sans 3,latin; font-size:14px; background-color: ${
                isDisabled ? theme.colors.secondary20 : "white"
              }}`,
              branding: false,
              disabled: isDisabled,

              hidden: true,
            }}
          />
        </Box>
      </Box>
    </>
  );
}
