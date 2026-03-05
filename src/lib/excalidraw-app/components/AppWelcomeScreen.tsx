import { WelcomeScreen } from "@excalidraw/excalidraw/index";
import React from "react";

export const AppWelcomeScreen: React.FC = React.memo((props) => {
  return (
    <WelcomeScreen>
      <WelcomeScreen.Center>
        <h1
          style={{
            fontFamily: "Virgil",
            fontSize: "3.5rem",
            margin: "0 0 1rem 0",
            textAlign: "center",
            fontWeight: "normal",
            lineHeight: "1.2",
            // Use CSS var for text color or fallback
            color: "var(--color-on-surface)",
          }}
        >
          Poket Canvas
        </h1>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLoadScene />
          <WelcomeScreen.Center.MenuItemHelp />
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
});
