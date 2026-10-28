const LOCAIS = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES' };

const TEXTOS = {
    en: {
        '+ Categoria': '+ Category', '+ Evento': '+ Event', '+ Movimento': '+ Transaction', '+ Neste dia': '+ On this day', '+ Tarefa': '+ Task',
        '0 pendentes': '0 pending', '1 dia antes': '1 day before', '1 hora antes': '1 hour before', '10 minutos antes': '10 minutes before', '30 minutos antes': '30 minutes before',
        'A minha conta': 'My account', 'A preparar o resumo do teu dia...': 'Preparing your day summary...', 'A tua conta': 'Your account',
        'A tua conta, o aspeto da app e as notificações.': 'Your account, the app look and notifications.',
        'AGENDA': 'CALENDAR', 'Agenda': 'Calendar', 'Agora': 'Now', 'Alta': 'High', 'Apagar': 'Delete', 'Aparência': 'Appearance',
        'Ativar notificações': 'Turn on notifications', 'Baixa': 'Low', 'Cancelar': 'Cancel', 'Categoria': 'Category', 'Categorias': 'Categories',
        'Conta': 'Account', 'Cor': 'Colour', 'Criar conta': 'Sign up', 'Dashboard': 'Dashboard', 'Data': 'Date', 'Definições': 'Settings',
        'Descrição (opcional)': 'Description (optional)', 'Despesa': 'Expense', 'Despesas': 'Expenses', 'Despesas do mês': 'Expenses this month',
        'Despesas por categoria': 'Expenses by category', 'Email': 'Email', 'Entra para veres os teus dados': 'Sign in to see your data', 'Entrar': 'Sign in',
        'Entrou': 'In', 'Enviamos um email com um link para definires uma nova palavra-passe.': 'We will email you a link to set a new password.',
        'Enviar link': 'Send link', 'Escolhe a tua nova palavra-passe.': 'Choose your new password.',
        'Escolhe o que aparece, o tamanho e a ordem. Fica guardado na conta e aparece igual nos outros dispositivos.': 'Choose what shows, its size and order. It is saved to your account and looks the same on your other devices.',
        'Esconder menu lateral': 'Hide side menu', 'Esqueci-me da palavra-passe': 'I forgot my password', 'Este mês': 'This month', 'Evento': 'Event',
        'Fechar': 'Close', 'Fechar menu lateral': 'Close side menu', 'Fim (opcional)': 'End (optional)', 'Finanças': 'Finances', 'Guardar': 'Save',
        'Hoje': 'Today', 'Início': 'Start', 'JPG, PNG ou WebP. Aparece em todos os dispositivos.': 'JPG, PNG or WebP. Shows on all your devices.',
        'LEMBRETES': 'REMINDERS', 'Lembrete': 'Reminder', 'Lembretes': 'Reminders', 'Limite mensal (€)': 'Monthly limit (€)', 'Marcar como lidas': 'Mark as read',
        'Menu': 'Menu', 'Menu lateral': 'Side menu', 'Menu lateral do ambiente de trabalho': 'Desktop side menu', 'Menu rápido': 'Quick menu', 'Minimizar': 'Minimise',
        'Monta o dashboard à tua maneira.': 'Build the dashboard your way.', 'Mostrar concluídas': 'Show completed', 'Movimentos': 'Transactions',
        'Mudar foto': 'Change photo', 'Mudar tema': 'Change theme', 'Média': 'Medium', 'Mês': 'Month', 'Mês anterior': 'Previous month', 'Mês seguinte': 'Next month',
        'Mínimo de 8 caracteres.': 'At least 8 characters.', 'Na hora': 'At the time', 'Nome': 'Name', 'Notificações': 'Notifications',
        'Nova categoria': 'New category', 'Nova palavra-passe': 'New password', 'Nova tarefa': 'New task', 'Novo evento': 'New event', 'Novo movimento': 'New transaction',
        'O menu aparece ao encostar o rato à esquerda do ecrã.': 'The menu shows when you move the mouse to the left edge of the screen.',
        'O que tens para fazer, por prioridade.': 'What you have to do, by priority.', 'O teu dashboard': 'Your dashboard', 'Olá': 'Hello',
        'Os teus dados ficam guardados na conta e aparecem em todos os dispositivos.': 'Your data is saved to your account and shows on all your devices.',
        'Palavra-passe': 'Password', 'Para onde vai o dinheiro': 'Where the money goes', 'Perfil': 'Profile', 'Perfil e definições': 'Profile and settings',
        'Personalizar widgets': 'Customise widgets', 'Pesquisar': 'Search', 'Pesquisar movimentos, tarefas, eventos...': 'Search transactions, tasks, events...',
        'Prazo': 'Due date', 'Principal': 'Main', 'Prioridade': 'Priority', 'Próximos': 'Upcoming', 'Próximos eventos': 'Upcoming events', 'Recentes': 'Recent',
        'Registo rápido': 'Quick add', 'Rendimento': 'Income', 'Rendimentos': 'Income', 'Rendimentos do mês': 'Income this month',
        'Rendimentos, despesas e para onde vai o teu dinheiro.': 'Income, expenses and where your money goes.', 'Repor padrão': 'Reset to default',
        'SALDO': 'BALANCE', 'Sair': 'Sign out', 'Sair do menu lateral': 'Leave side menu', 'Saiu': 'Out', 'Saldo atual': 'Current balance', 'Saldo do mês': 'Month balance',
        'Sem eventos': 'No events', 'Sem lembrete': 'No reminder', 'Sessão': 'Session', 'TAREFAS': 'TASKS', 'Tarefa': 'Task', 'Tarefas': 'Tasks',
        'Tema claro ou escuro, guardado neste dispositivo.': 'Light or dark theme, saved on this device.', 'Terminar sessão': 'Sign out', 'Tipo': 'Type',
        'Tudo': 'All', 'Tudo em dia': 'All caught up', 'Título': 'Title', 'Valor (€)': 'Amount (€)', 'Voltar': 'Back', 'Voltar a hoje': 'Back to today',
        'Widgets': 'Widgets', 'pendentes': 'pending', 'Últimos 6 meses': 'Last 6 months',
        'Idioma': 'Language', 'A língua da app, guardada neste dispositivo.': 'The app language, saved on this device.',
        'Bom dia': 'Good morning', 'Boa tarde': 'Good afternoon', 'Boa noite': 'Good evening',
        'evento': 'event', 'eventos': 'events', 'tarefa': 'task', 'tarefas': 'tasks', 'por fazer': 'to do', 'hoje': 'today', 'Saldo': 'Balance',
        'A seguir:': 'Next:', 'Sem eventos marcados.': 'No events planned.', 'Nada marcado para este dia.': 'Nothing planned for this day.',
        'este mês': 'this month', 'gastos': 'spent',
        'Positivo': 'Positive', 'Negativo': 'Negative', 'Dinheiro disponível em todas as contas': 'Money available across all accounts',
        'Sobra este mês': 'Left this month', 'Gastos': 'Spent', 'Média': 'Average', '€ hoje': '€ today', '€/dia em média': '€/day on average',
        'Ver todas': 'See all', 'Ver menos': 'See less',
        'Sem movimentos': 'No transactions', 'movimento': 'transaction', 'movimentos': 'transactions', 'média': 'avg',
        'Subir': 'Up', 'Descer': 'Down', 'Para hoje': 'For today', 'Atrasadas': 'Overdue', 'Progresso': 'Progress', 'Nada aqui.': 'Nothing here.', 'Nada marcado para hoje': 'Nothing planned for today', 'Sem prazo': 'No due date', 'Mostrar concluídas': 'Show completed',
        'Feriado nacional': 'Public holiday', 'Ano Novo': "New Year's Day", 'Carnaval': 'Carnival', 'Sexta-feira Santa': 'Good Friday', 'Páscoa': 'Easter', 'Dia da Liberdade': 'Freedom Day', 'Dia do Trabalhador': 'Labour Day', 'Corpo de Deus': 'Corpus Christi', 'Dia de Portugal': 'Portugal Day', 'Assunção de Nossa Senhora': 'Assumption Day', 'Implantação da República': 'Republic Day', 'Dia de Todos-os-Santos': "All Saints' Day", 'Restauração da Independência': 'Restoration of Independence', 'Imaculada Conceição': 'Immaculate Conception', 'Natal': 'Christmas',
        'para hoje': 'for today', 'na agenda': 'on the calendar', 'Tens': 'You have', 'e': 'and',
        'Dia livre: não tens nada marcado para hoje.': 'Free day: nothing planned for today.', 'Este mês já saíram': 'This month you have spent',
        'Ainda não registaste despesas este mês.': 'No expenses recorded this month yet.', 'Sobram {v} este mês.': '{v} left this month.',
        'Gastaste {v} a mais do que recebeste.': 'You spent {v} more than you received.', 'Tudo feito. Bom trabalho!': 'All done. Good job!',
        'Sem tarefas. Cria a primeira em Tarefas.': 'No tasks. Create your first one in Tasks.',
        'Em breve': 'Coming soon', 'Em breve vais ter widgets para a área de trabalho.': 'Desktop widgets are coming soon.', 'Termos de Utilização': 'Terms of Use', 'Li e aceito os': 'I have read and accept the', 'Li e aceito os Termos de Utilização': 'I have read and accept the Terms of Use', 'Aceitar e continuar': 'Accept and continue',
        'Entra ou cria a tua conta com o Google. Sem palavras-passe para decorar.': 'Sign in or create your account with Google. No passwords to remember.', 'Ao continuar, aceitas os': 'By continuing, you accept the',
        'Entra ou cria a tua conta com o Google. Sem palavras-passe para decorar.': 'Inicia sesión o crea tu cuenta con Google. Sin contraseñas que recordar.', 'Ao continuar, aceitas os': 'Al continuar, aceptas los',
        'Atualizações': 'Updates', 'Versão': 'Version', 'Atualizações automáticas': 'Automatic updates', 'Descarrega sozinho e instala quando fechas o HUROH.': 'Downloads by itself and installs when you close HUROH.',
        'Procurar atualizações': 'Check for updates', 'Descarregar agora': 'Download now', 'Reiniciar e atualizar': 'Restart and update', 'A procurar atualizações...': 'Checking for updates...',
        'Há uma versão nova: {v}.': 'A new version is available: {v}.', 'A descarregar a versão {v}...': 'Downloading version {v}...', 'A versão {v} está pronta. Reinicia para atualizar.': 'Version {v} is ready. Restart to update.',
        'Não foi possível procurar atualizações. Vê a ligação à internet.': 'Could not check for updates. Check your internet connection.', 'Tens a versão mais recente.': 'You have the latest version.',
        'Versão de desenvolvimento: as atualizações só funcionam na app instalada.': 'Development version: updates only work in the installed app.', 'Versão e atualizações': 'Version and updates',
        'Atualizações': 'Actualizaciones', 'Versão': 'Versión', 'Atualizações automáticas': 'Actualizaciones automáticas', 'Descarrega sozinho e instala quando fechas o HUROH.': 'Se descarga solo y se instala al cerrar HUROH.',
        'Procurar atualizações': 'Buscar actualizaciones', 'Descarregar agora': 'Descargar ahora', 'Reiniciar e atualizar': 'Reiniciar y actualizar', 'A procurar atualizações...': 'Buscando actualizaciones...',
        'Há uma versão nova: {v}.': 'Hay una versión nueva: {v}.', 'A descarregar a versão {v}...': 'Descargando la versión {v}...', 'A versão {v} está pronta. Reinicia para atualizar.': 'La versión {v} está lista. Reinicia para actualizar.',
        'Não foi possível procurar atualizações. Vê a ligação à internet.': 'No se pudo buscar actualizaciones. Revisa la conexión a internet.', 'Tens a versão mais recente.': 'Tienes la versión más reciente.',
        'Versão de desenvolvimento: as atualizações só funcionam na app instalada.': 'Versión de desarrollo: las actualizaciones solo funcionan en la app instalada.', 'Versão e atualizações': 'Versión y actualizaciones',
        'Os teus dados': 'Your data', 'Exportar dados': 'Export data', 'Apagar conta': 'Delete account', 'Apagar tudo': 'Delete everything', 'A apagar...': 'Deleting...',
        'Leva uma cópia de tudo ou apaga a conta e todos os dados de uma vez.': 'Take a copy of everything, or delete your account and all your data at once.',
        'Isto apaga para sempre a tua conta e todos os dados: movimentos, categorias, eventos, tarefas, foto e perfil, na nuvem e neste dispositivo. Não dá para desfazer.': 'This permanently deletes your account and all your data: transactions, categories, events, tasks, photo and profile, in the cloud and on this device. It cannot be undone.',
        'Apagar também os backups deste computador': 'Also delete the backups on this computer', 'Escreve APAGAR para confirmar': 'Type APAGAR to confirm',
        'Precisas de internet para apagar a conta.': 'You need internet to delete your account.', 'Não foi possível apagar a conta. Tenta outra vez.': 'Could not delete the account. Try again.',
        'A tua conta e todos os teus dados foram apagados.': 'Your account and all your data have been deleted.',
        'Os teus dados': 'Tus datos', 'Exportar dados': 'Exportar datos', 'Apagar conta': 'Borrar cuenta', 'Apagar tudo': 'Borrar todo', 'A apagar...': 'Borrando...',
        'Leva uma cópia de tudo ou apaga a conta e todos os dados de uma vez.': 'Llévate una copia de todo o borra la cuenta y todos los datos de una vez.',
        'Isto apaga para sempre a tua conta e todos os dados: movimentos, categorias, eventos, tarefas, foto e perfil, na nuvem e neste dispositivo. Não dá para desfazer.': 'Esto borra para siempre tu cuenta y todos los datos: movimientos, categorías, eventos, tareas, foto y perfil, en la nube y en este dispositivo. No se puede deshacer.',
        'Apagar também os backups deste computador': 'Borrar también las copias de este ordenador', 'Escreve APAGAR para confirmar': 'Escribe APAGAR para confirmar',
        'Precisas de internet para apagar a conta.': 'Necesitas internet para borrar la cuenta.', 'Não foi possível apagar a conta. Tenta outra vez.': 'No se pudo borrar la cuenta. Inténtalo de nuevo.',
        'A tua conta e todos os teus dados foram apagados.': 'Tu cuenta y todos tus datos han sido borrados.',
        'Semanal': 'Weekly', 'Mensal': 'Monthly', 'Iniciar com o Windows': 'Start with Windows', 'Ligar': 'Turn on', 'Desligar': 'Turn off',
        'Ao ligar o computador, abre só o menu lateral.': 'When you turn on the computer, only the side menu opens.',
        'O HUROH só abre quando o abrires tu.': 'HUROH only opens when you open it.',
        'ou': 'or', 'Continuar com Google': 'Continue with Google', 'Continua no navegador que acabou de abrir.': 'Continue in the browser that just opened.', 'Não foi possível entrar com o Google.': 'Could not sign in with Google.',
        'Pular': 'Skip', 'Anterior': 'Previous', 'Seguinte': 'Next', 'Começar': 'Start', 'Tema': 'Theme', 'Pesquisa': 'Search',
        'Bem-vindo ao HUROH': 'Welcome to HUROH',
        'Vamos ver o essencial em menos de um minuto. Podes saltar o tutorial quando quiseres.': "Let's see the essentials in under a minute. You can skip the tutorial whenever you like.",
        'Registo rápido': 'Quick add',
        'Regista já uma despesa ou um rendimento aqui, sem sair do dashboard.': 'Add an expense or income right here, without leaving the dashboard.',
        'O menu lateral aparece ao encostar o rato à esquerda do ecrã. Este botão mostra-o ou esconde-o quando quiseres.': 'The side menu appears when you move the mouse to the left edge of the screen. This button shows or hides it whenever you want.',
        'Procura movimentos, tarefas e eventos em todo o HUROH. Também abre com Ctrl K.': 'Search transactions, tasks and events across HUROH. It also opens with Ctrl K.',
        'Claro ou escuro: aqui escolhes o aspeto da app.': 'Light or dark: choose how the app looks.',
        'Os lembretes de eventos e os prazos das tarefas aparecem aqui.': 'Event reminders and task due dates show up here.',
        'Vê o teu perfil, vai às definições ou termina a sessão.': 'See your profile, go to settings or sign out.',
        'Cria movimentos com este botão e filtra-os por mês, tipo ou categoria. Cada categoria pode ter um limite mensal.': 'Create transactions with this button and filter them by month, type or category. Each category can have a monthly limit.',
        'Alterna entre vista semanal e mensal, carrega num dia para ver os eventos e marca lembretes. Os feriados já vêm marcados.': 'Switch between weekly and monthly view, tap a day to see its events and set reminders. Public holidays are already marked.',
        'Estão divididas por prioridade. Dá-lhes prazo e mostra as concluídas quando quiseres rever.': 'They are split by priority. Give them due dates and show completed ones whenever you want to review.',
        'Muda a tua foto, o tema e o idioma, ativa as notificações, exporta os dados ou apaga a conta.': 'Change your photo, theme and language, turn on notifications, export your data or delete your account.',
        'Está tudo pronto': 'All set',
        'O dashboard mostra o teu saldo, o mês e os próximos eventos. Agora aproveita a app e descobre as demais funcionalidades!': 'The dashboard shows your balance, the month and your upcoming events. Now enjoy the app and discover the rest of the features!',
    },
    es: {
        '+ Categoria': '+ Categoría', '+ Evento': '+ Evento', '+ Movimento': '+ Movimiento', '+ Neste dia': '+ Este día', '+ Tarefa': '+ Tarea',
        '0 pendentes': '0 pendientes', '1 dia antes': '1 día antes', '1 hora antes': '1 hora antes', '10 minutos antes': '10 minutos antes', '30 minutos antes': '30 minutos antes',
        'A minha conta': 'Mi cuenta', 'A preparar o resumo do teu dia...': 'Preparando el resumen de tu día...', 'A tua conta': 'Tu cuenta',
        'A tua conta, o aspeto da app e as notificações.': 'Tu cuenta, el aspecto de la app y las notificaciones.',
        'AGENDA': 'AGENDA', 'Agenda': 'Agenda', 'Agora': 'Ahora', 'Alta': 'Alta', 'Apagar': 'Eliminar', 'Aparência': 'Apariencia',
        'Ativar notificações': 'Activar notificaciones', 'Baixa': 'Baja', 'Cancelar': 'Cancelar', 'Categoria': 'Categoría', 'Categorias': 'Categorías',
        'Conta': 'Cuenta', 'Cor': 'Color', 'Criar conta': 'Crear cuenta', 'Dashboard': 'Panel', 'Data': 'Fecha', 'Definições': 'Ajustes',
        'Descrição (opcional)': 'Descripción (opcional)', 'Despesa': 'Gasto', 'Despesas': 'Gastos', 'Despesas do mês': 'Gastos del mes',
        'Despesas por categoria': 'Gastos por categoría', 'Email': 'Correo', 'Entra para veres os teus dados': 'Inicia sesión para ver tus datos', 'Entrar': 'Entrar',
        'Entrou': 'Entró', 'Enviamos um email com um link para definires uma nova palavra-passe.': 'Te enviamos un correo con un enlace para crear una nueva contraseña.',
        'Enviar link': 'Enviar enlace', 'Escolhe a tua nova palavra-passe.': 'Elige tu nueva contraseña.',
        'Escolhe o que aparece, o tamanho e a ordem. Fica guardado na conta e aparece igual nos outros dispositivos.': 'Elige qué aparece, el tamaño y el orden. Se guarda en tu cuenta y se ve igual en tus otros dispositivos.',
        'Esconder menu lateral': 'Ocultar menú lateral', 'Esqueci-me da palavra-passe': 'Olvidé mi contraseña', 'Este mês': 'Este mes', 'Evento': 'Evento',
        'Fechar': 'Cerrar', 'Fechar menu lateral': 'Cerrar menú lateral', 'Fim (opcional)': 'Fin (opcional)', 'Finanças': 'Finanzas', 'Guardar': 'Guardar',
        'Hoje': 'Hoy', 'Início': 'Inicio', 'JPG, PNG ou WebP. Aparece em todos os dispositivos.': 'JPG, PNG o WebP. Aparece en todos tus dispositivos.',
        'LEMBRETES': 'RECORDATORIOS', 'Lembrete': 'Recordatorio', 'Lembretes': 'Recordatorios', 'Limite mensal (€)': 'Límite mensual (€)', 'Marcar como lidas': 'Marcar como leídas',
        'Menu': 'Menú', 'Menu lateral': 'Menú lateral', 'Menu lateral do ambiente de trabalho': 'Menú lateral del escritorio', 'Menu rápido': 'Menú rápido', 'Minimizar': 'Minimizar',
        'Monta o dashboard à tua maneira.': 'Arma el panel a tu manera.', 'Mostrar concluídas': 'Mostrar completadas', 'Movimentos': 'Movimientos',
        'Mudar foto': 'Cambiar foto', 'Mudar tema': 'Cambiar tema', 'Média': 'Media', 'Mês': 'Mes', 'Mês anterior': 'Mes anterior', 'Mês seguinte': 'Mes siguiente',
        'Mínimo de 8 caracteres.': 'Mínimo 8 caracteres.', 'Na hora': 'A la hora', 'Nome': 'Nombre', 'Notificações': 'Notificaciones',
        'Nova categoria': 'Nueva categoría', 'Nova palavra-passe': 'Nueva contraseña', 'Nova tarefa': 'Nueva tarea', 'Novo evento': 'Nuevo evento', 'Novo movimento': 'Nuevo movimiento',
        'O menu aparece ao encostar o rato à esquerda do ecrã.': 'El menú aparece al llevar el ratón al borde izquierdo de la pantalla.',
        'O que tens para fazer, por prioridade.': 'Lo que tienes que hacer, por prioridad.', 'O teu dashboard': 'Tu panel', 'Olá': 'Hola',
        'Os teus dados ficam guardados na conta e aparecem em todos os dispositivos.': 'Tus datos se guardan en tu cuenta y aparecen en todos tus dispositivos.',
        'Palavra-passe': 'Contraseña', 'Para onde vai o dinheiro': 'A dónde va el dinero', 'Perfil': 'Perfil', 'Perfil e definições': 'Perfil y ajustes',
        'Personalizar widgets': 'Personalizar widgets', 'Pesquisar': 'Buscar', 'Pesquisar movimentos, tarefas, eventos...': 'Buscar movimientos, tareas, eventos...',
        'Prazo': 'Plazo', 'Principal': 'Principal', 'Prioridade': 'Prioridad', 'Próximos': 'Próximos', 'Próximos eventos': 'Próximos eventos', 'Recentes': 'Recientes',
        'Registo rápido': 'Registro rápido', 'Rendimento': 'Ingreso', 'Rendimentos': 'Ingresos', 'Rendimentos do mês': 'Ingresos del mes',
        'Rendimentos, despesas e para onde vai o teu dinheiro.': 'Ingresos, gastos y a dónde va tu dinero.', 'Repor padrão': 'Restablecer',
        'SALDO': 'SALDO', 'Sair': 'Salir', 'Sair do menu lateral': 'Salir del menú lateral', 'Saiu': 'Salió', 'Saldo atual': 'Saldo actual', 'Saldo do mês': 'Saldo del mes',
        'Sem eventos': 'Sin eventos', 'Sem lembrete': 'Sin recordatorio', 'Sessão': 'Sesión', 'TAREFAS': 'TAREAS', 'Tarefa': 'Tarea', 'Tarefas': 'Tareas',
        'Tema claro ou escuro, guardado neste dispositivo.': 'Tema claro u oscuro, guardado en este dispositivo.', 'Terminar sessão': 'Cerrar sesión', 'Tipo': 'Tipo',
        'Tudo': 'Todo', 'Tudo em dia': 'Todo al día', 'Título': 'Título', 'Valor (€)': 'Importe (€)', 'Voltar': 'Volver', 'Voltar a hoje': 'Volver a hoy',
        'Widgets': 'Widgets', 'pendentes': 'pendientes', 'Últimos 6 meses': 'Últimos 6 meses',
        'Idioma': 'Idioma', 'A língua da app, guardada neste dispositivo.': 'El idioma de la app, guardado en este dispositivo.',
        'Bom dia': 'Buenos días', 'Boa tarde': 'Buenas tardes', 'Boa noite': 'Buenas noches',
        'evento': 'evento', 'eventos': 'eventos', 'tarefa': 'tarea', 'tarefas': 'tareas', 'por fazer': 'por hacer', 'hoje': 'hoy', 'Saldo': 'Saldo',
        'A seguir:': 'Siguiente:', 'Sem eventos marcados.': 'Sin eventos programados.', 'Nada marcado para este dia.': 'Nada programado para este día.',
        'este mês': 'este mes', 'gastos': 'gastado',
        'Positivo': 'Positivo', 'Negativo': 'Negativo', 'Dinheiro disponível em todas as contas': 'Dinero disponible en todas las cuentas',
        'Sobra este mês': 'Te queda este mes', 'Gastos': 'Gastos', 'Média': 'Media', '€ hoje': '€ hoy', '€/dia em média': '€/día de media',
        'Ver todas': 'Ver todas', 'Ver menos': 'Ver menos',
        'Sem movimentos': 'Sin movimientos', 'movimento': 'movimiento', 'movimentos': 'movimientos', 'média': 'media',
        'Subir': 'Subir', 'Descer': 'Bajar', 'Para hoje': 'Para hoy', 'Atrasadas': 'Atrasadas', 'Progresso': 'Progreso', 'Nada aqui.': 'Nada aquí.', 'Nada marcado para hoje': 'Nada programado para hoy', 'Sem prazo': 'Sin plazo', 'Mostrar concluídas': 'Mostrar completadas',
        'Feriado nacional': 'Festivo nacional', 'Ano Novo': 'Año Nuevo', 'Carnaval': 'Carnaval', 'Sexta-feira Santa': 'Viernes Santo', 'Páscoa': 'Pascua', 'Dia da Liberdade': 'Día de la Libertad', 'Dia do Trabalhador': 'Día del Trabajador', 'Corpo de Deus': 'Corpus Christi', 'Dia de Portugal': 'Día de Portugal', 'Assunção de Nossa Senhora': 'Asunción', 'Implantação da República': 'Día de la República', 'Dia de Todos-os-Santos': 'Todos los Santos', 'Restauração da Independência': 'Restauración de la Independencia', 'Imaculada Conceição': 'Inmaculada Concepción', 'Natal': 'Navidad',
        'para hoje': 'para hoy', 'na agenda': 'en la agenda', 'Tens': 'Tienes', 'e': 'y',
        'Dia livre: não tens nada marcado para hoje.': 'Día libre: no tienes nada programado para hoy.', 'Este mês já saíram': 'Este mes ya gastaste', 'Ainda não registaste despesas este mês.': 'Aún no registraste gastos este mes.',
        'Sobram {v} este mês.': 'Te quedan {v} este mes.', 'Gastaste {v} a mais do que recebeste.': 'Gastaste {v} más de lo que recibiste.',
        'Tudo feito. Bom trabalho!': 'Todo hecho. ¡Buen trabajo!', 'Sem tarefas. Cria a primeira em Tarefas.': 'Sin tareas. Crea la primera en Tareas.',
        'Em breve': 'Próximamente', 'Em breve vais ter widgets para a área de trabalho.': 'Pronto tendrás widgets para el escritorio.', 'Termos de Utilização': 'Términos de uso', 'Li e aceito os': 'He leído y acepto los', 'Li e aceito os Termos de Utilização': 'He leído y acepto los Términos de uso', 'Aceitar e continuar': 'Aceptar y continuar',
        'Semanal': 'Semanal', 'Mensal': 'Mensual', 'Iniciar com o Windows': 'Iniciar con Windows', 'Ligar': 'Activar', 'Desligar': 'Desactivar',
        'Ao ligar o computador, abre só o menu lateral.': 'Al encender el ordenador, solo se abre el menú lateral.',
        'O HUROH só abre quando o abrires tu.': 'HUROH solo se abre cuando tú lo abres.',
        'ou': 'o', 'Continuar com Google': 'Continuar con Google', 'Continua no navegador que acabou de abrir.': 'Continúa en el navegador que se acaba de abrir.', 'Não foi possível entrar com o Google.': 'No se pudo iniciar sesión con Google.',
        'Pular': 'Saltar', 'Seguinte': 'Siguiente', 'Começar': 'Empezar', 'Pesquisa': 'Buscar',
        'Bem-vindo ao HUROH': 'Bienvenido a HUROH',
        'Vamos ver o essencial em menos de um minuto. Podes saltar o tutorial quando quiseres.': 'Vamos a lo esencial en menos de un minuto. Puedes saltarte el tutorial cuando quieras.',
        'Registo rápido': 'Registro rápido',
        'Regista já uma despesa ou um rendimento aqui, sem sair do dashboard.': 'Registra ya un gasto o un ingreso aquí, sin salir del panel.',
        'O menu lateral aparece ao encostar o rato à esquerda do ecrã. Este botão mostra-o ou esconde-o quando quiseres.': 'El menú lateral aparece al llevar el ratón al borde izquierdo de la pantalla. Este botón lo muestra u oculta cuando quieras.',
        'Procura movimentos, tarefas e eventos em todo o HUROH. Também abre com Ctrl K.': 'Busca movimientos, tareas y eventos en todo HUROH. También se abre con Ctrl K.',
        'Claro ou escuro: aqui escolhes o aspeto da app.': 'Claro u oscuro: aquí eliges el aspecto de la app.',
        'Os lembretes de eventos e os prazos das tarefas aparecem aqui.': 'Los recordatorios de eventos y los plazos de las tareas aparecen aquí.',
        'Vê o teu perfil, vai às definições ou termina a sessão.': 'Mira tu perfil, ve a los ajustes o cierra la sesión.',
        'Cria movimentos com este botão e filtra-os por mês, tipo ou categoria. Cada categoria pode ter um limite mensal.': 'Crea movimientos con este botón y filtra por mes, tipo o categoría. Cada categoría puede tener un límite mensual.',
        'Alterna entre vista semanal e mensal, carrega num dia para ver os eventos e marca lembretes. Os feriados já vêm marcados.': 'Alterna entre vista semanal y mensal, toca un día para ver sus eventos y pon recordatorios. Los festivos ya vienen marcados.',
        'Estão divididas por prioridade. Dá-lhes prazo e mostra as concluídas quando quiseres rever.': 'Están divididas por prioridad. Dales plazo y muestra las completadas cuando quieras revisarlas.',
        'Muda a tua foto, o tema e o idioma, ativa as notificações, exporta os dados ou apaga a conta.': 'Cambia tu foto, el tema y el idioma, activa las notificaciones, exporta los datos o borra la cuenta.',
        'Está tudo pronto': 'Todo listo',
        'O dashboard mostra o teu saldo, o mês e os próximos eventos. Agora aproveita a app e descobre as demais funcionalidades!': 'El panel muestra tu saldo, el mes y los próximos eventos. Ahora disfruta de la app y descubre las demás funcionalidades!',
    },
};

function lerIdioma() {
    try {
        const guardado = localStorage.getItem('idioma');
        if (LOCAIS[guardado]) return guardado;

        // primeira vez depois de instalar: usa o idioma escolhido no instalador
        const instalacao = window.huroh?.idiomaInstalacao;
        if (LOCAIS[instalacao]) {
            localStorage.setItem('idioma', instalacao);
            return instalacao;
        }
        return 'pt';
    } catch {
        return 'pt';
    }
}

export const idioma = lerIdioma();
export const local = LOCAIS[idioma];

document.documentElement.lang = local;

export function t(texto) {
    return TEXTOS[idioma]?.[texto] ?? texto;
}

export function mudarIdioma(novo) {
    try {
        localStorage.setItem('idioma', novo);
    } catch {}
    location.reload();
}


// traduzir
// ======================================================
const ATRIBUTOS = ['placeholder', 'title', 'aria-label'];
const jaTraduzidos = new WeakMap();

function traduzirNo(no) {
    if (no.nodeType === Node.TEXT_NODE) {
        if (jaTraduzidos.get(no) === no.textContent) return;
        const limpo = no.textContent.trim();
        const traduzido = TEXTOS[idioma][limpo];
        if (limpo && traduzido && traduzido !== limpo) no.textContent = no.textContent.replace(limpo, traduzido);
        jaTraduzidos.set(no, no.textContent);
        return;
    }

    if (no.nodeType !== Node.ELEMENT_NODE || no.closest('script, style, [data-sem-traducao]')) return;

    ATRIBUTOS.forEach(atributo => {
        const valor = no.getAttribute(atributo);
        if (valor && TEXTOS[idioma][valor] && TEXTOS[idioma][valor] !== valor) no.setAttribute(atributo, TEXTOS[idioma][valor]);
    });

    no.childNodes.forEach(traduzirNo);
}

if (idioma !== 'pt') {
    traduzirNo(document.body);
    document.title = t(document.title);

    new MutationObserver(mudancas => {
        mudancas.forEach(mudanca => {
            if (mudanca.type === 'characterData') traduzirNo(mudanca.target);
            mudanca.addedNodes.forEach(traduzirNo);
        });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
}

window.addEventListener('storage', evento => {
    if (evento.key === 'idioma') location.reload();
});
