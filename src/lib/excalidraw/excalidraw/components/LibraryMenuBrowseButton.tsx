import { t } from "../i18n";

import type { ExcalidrawProps, UIAppState } from "../types";

const LibraryMenuBrowseButton = ({
  theme,
  id,
  libraryReturnUrl,
}: {
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  theme: UIAppState["theme"];
  id: string;
}) => {
  return (
    <span
      className="library-menu-browse-button"
      style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" }}
      title="Browse Libraries is not available"
    >
      {t("labels.libraries")}
    </span>
  );
};

export default LibraryMenuBrowseButton;
