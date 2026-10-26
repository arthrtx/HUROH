!include nsDialogs.nsh
!include LogicLib.nsh


; textos (português, inglês e espanhol)
; ======================================================
!macro customHeader
    LangString hurohBoasVindas ${LANG_PORTUGUESE} "Este assistente vai instalar a HUROH ${VERSION} no teu computador.$\r$\n$\r$\nFinanças, agenda e tarefas no mesmo sítio, sempre sincronizadas.$\r$\n$\r$\nClica em Seguinte para continuar."
    LangString hurohBoasVindas ${LANG_ENGLISH} "This wizard will install HUROH ${VERSION} on your computer.$\r$\n$\r$\nFinances, calendar and tasks in one place, always in sync.$\r$\n$\r$\nClick Next to continue."
    LangString hurohBoasVindas ${LANG_SPANISHINTERNATIONAL} "Este asistente instalará HUROH ${VERSION} en tu ordenador.$\r$\n$\r$\nFinanzas, agenda y tareas en un solo lugar, siempre sincronizadas.$\r$\n$\r$\nHaz clic en Siguiente para continuar."

    LangString hurohBemVindo ${LANG_PORTUGUESE} "Bem-vindo à HUROH"
    LangString hurohBemVindo ${LANG_ENGLISH} "Welcome to HUROH"
    LangString hurohBemVindo ${LANG_SPANISHINTERNATIONAL} "Bienvenido a HUROH"

    LangString hurohOpcoesTitulo ${LANG_PORTUGUESE} "O que vai ser instalado"
    LangString hurohOpcoesTitulo ${LANG_ENGLISH} "What will be installed"
    LangString hurohOpcoesTitulo ${LANG_SPANISHINTERNATIONAL} "Qué se va a instalar"

    LangString hurohOpcoesSub ${LANG_PORTUGUESE} "Confirma o que entra no computador e escolhe as opções."
    LangString hurohOpcoesSub ${LANG_ENGLISH} "Check what goes on your computer and pick the options."
    LangString hurohOpcoesSub ${LANG_SPANISHINTERNATIONAL} "Revisa lo que se instala en el ordenador y elige las opciones."

    LangString hurohLista ${LANG_PORTUGUESE} "•  HUROH ${VERSION}: finanças, agenda e tarefas.$\r$\n•  Dependências: motor Electron 33 (Chromium e Node.js), necessário para a app funcionar. Já vem dentro do instalador, não é preciso internet.$\r$\n•  Atalho no menu Iniciar e desinstalador em Aplicações instaladas.$\r$\n$\r$\nEspaço necessário: cerca de 270 MB. Não pede administrador."
    LangString hurohLista ${LANG_ENGLISH} "•  HUROH ${VERSION}: finances, calendar and tasks.$\r$\n•  Dependencies: Electron 33 engine (Chromium and Node.js), needed for the app to run. It is already inside the installer, no internet needed.$\r$\n•  Start menu shortcut and uninstaller in Installed apps.$\r$\n$\r$\nSpace needed: about 270 MB. No administrator required."
    LangString hurohLista ${LANG_SPANISHINTERNATIONAL} "•  HUROH ${VERSION}: finanzas, agenda y tareas.$\r$\n•  Dependencias: motor Electron 33 (Chromium y Node.js), necesario para que la app funcione. Ya viene dentro del instalador, no hace falta internet.$\r$\n•  Acceso en el menú Inicio y desinstalador en Aplicaciones instaladas.$\r$\n$\r$\nEspacio necesario: unos 270 MB. No pide administrador."

    LangString hurohAtalho ${LANG_PORTUGUESE} "Criar atalho na área de trabalho"
    LangString hurohAtalho ${LANG_ENGLISH} "Create a desktop shortcut"
    LangString hurohAtalho ${LANG_SPANISHINTERNATIONAL} "Crear acceso directo en el escritorio"

    LangString hurohArranque ${LANG_PORTUGUESE} "Abrir a HUROH quando o Windows iniciar"
    LangString hurohArranque ${LANG_ENGLISH} "Open HUROH when Windows starts"
    LangString hurohArranque ${LANG_SPANISHINTERNATIONAL} "Abrir HUROH al iniciar Windows"

    LangString hurohAInstalar ${LANG_PORTUGUESE} "A instalar a HUROH e as dependências (motor Electron: Chromium e Node.js)..."
    LangString hurohAInstalar ${LANG_ENGLISH} "Installing HUROH and its dependencies (Electron engine: Chromium and Node.js)..."
    LangString hurohAInstalar ${LANG_SPANISHINTERNATIONAL} "Instalando HUROH y sus dependencias (motor Electron: Chromium y Node.js)..."

    LangString hurohAtalhos ${LANG_PORTUGUESE} "A criar os atalhos..."
    LangString hurohAtalhos ${LANG_ENGLISH} "Creating shortcuts..."
    LangString hurohAtalhos ${LANG_SPANISHINTERNATIONAL} "Creando accesos directos..."

    !ifndef BUILD_UNINSTALLER
        ; corre antes da secção principal, que esconde os detalhes: o texto fica à vista enquanto copia
        Section "-preparar"
            SetDetailsPrint textonly
            DetailPrint "$(hurohAInstalar)"
        SectionEnd
    !endif
!macroend


; instala sempre só para este utilizador (não pede administrador)
; ======================================================
!macro customInstallMode
    StrCpy $isForceCurrentInstall "1"
!macroend


; boas-vindas
; ======================================================
!macro customWelcomePage
    !define MUI_WELCOMEPAGE_TITLE "$(hurohBemVindo)"
    !define MUI_WELCOMEPAGE_TEXT "$(hurohBoasVindas)"
    !insertmacro MUI_PAGE_WELCOME
!macroend


; o que vai ser instalado + opções
; ======================================================
!macro customPageAfterChangeDir
    Var CriarAtalho
    Var CaixaAtalho
    Var IniciarComWindows
    Var CaixaArranque

    Page custom PaginaOpcoes SairOpcoes

    Function PaginaOpcoes
        !insertmacro MUI_HEADER_TEXT "$(hurohOpcoesTitulo)" "$(hurohOpcoesSub)"
        nsDialogs::Create 1018
        Pop $0

        ${NSD_CreateLabel} 0 0 100% 82u "$(hurohLista)"
        Pop $0

        ${NSD_CreateCheckbox} 0 92u 100% 12u "$(hurohAtalho)"
        Pop $CaixaAtalho
        ${If} $CriarAtalho == ""
            StrCpy $CriarAtalho ${BST_CHECKED}
        ${EndIf}
        ${NSD_SetState} $CaixaAtalho $CriarAtalho

        ${NSD_CreateCheckbox} 0 108u 100% 12u "$(hurohArranque)"
        Pop $CaixaArranque
        ${NSD_SetState} $CaixaArranque $IniciarComWindows

        nsDialogs::Show
    FunctionEnd

    Function SairOpcoes
        ${NSD_GetState} $CaixaAtalho $CriarAtalho
        ${NSD_GetState} $CaixaArranque $IniciarComWindows
    FunctionEnd
!macroend


; instalar e desinstalar
; ======================================================
!macro customInstall
    SetDetailsPrint textonly
    DetailPrint "$(hurohAtalhos)"

    ${If} $CriarAtalho == ${BST_CHECKED}
        CreateShortCut "$DESKTOP\HUROH.lnk" "$INSTDIR\HUROH.exe" "" "$INSTDIR\HUROH.exe" 0
    ${EndIf}

    ${If} $IniciarComWindows == ${BST_CHECKED}
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "HUROH" '"$INSTDIR\HUROH.exe"'
    ${EndIf}

    ; a app abre no idioma escolhido aqui
    ${If} $LANGUAGE == ${LANG_ENGLISH}
        StrCpy $0 "en"
    ${ElseIf} $LANGUAGE == ${LANG_SPANISHINTERNATIONAL}
        StrCpy $0 "es"
    ${Else}
        StrCpy $0 "pt"
    ${EndIf}
    FileOpen $1 "$INSTDIR\idioma.txt" w
    FileWrite $1 $0
    FileClose $1

    SetDetailsPrint none
!macroend

!macro customUnInstall
    Delete "$DESKTOP\HUROH.lnk"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "HUROH"
!macroend
