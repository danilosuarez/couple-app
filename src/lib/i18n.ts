export const labels = {
    common: {
        save: "Guardar",
        cancel: "Cancelar",
        add: "Agregar",
        create: "Crear",
        delete: "Eliminar",
        edit: "Editar",
        date: "Fecha",
        amount: "Monto",
        description: "Descripción",
        loading: "Cargando...",
        notes: "Notas"
    },
    dashboard: {
        netWorth: "Patrimonio Neto",
        totalBalance: "Saldo Total",
        recentActivity: "Actividad Reciente",
        newExpense: "Agregar Gasto",
        newIncome: "Agregar Ingreso",
        seeAll: "Ver todo",
        myAccounts: "Mis Cuentas",
        addAccount: "Nueva Cuenta",
        summary: "Resumen",
        accounts: "Cuentas",
        addTransaction: "Nueva Transacción",
        recurringDue: "Pago Recurrente Pendiente",
        settlementBalance: "Balance de Liquidación",
        totalSpentMonth: "Gasto Total (Mes)",
        activeGoals: "Metas Activas",
        youOwe: "Debes",
        youAreOwed: "Recibes",
        settled: "Al Día",
        viewDetails: "Ver Detalle"
    },
    transactions: {
        details: "Detalle de Transacción",
        receipt: "Recibo / Comprobante",
        paidBy: "Pagado por",
        category: "Categoría",
        split: "División",
        comments: "Comentarios & Notas",
        noComments: "Aún no hay comentarios",
        addComment: "Escribe un comentario...",
        send: "Enviar",
        expense: "Gasto",
        income: "Ingreso",
        saving: "Ahorro / Inversión",
        transfer: "Transferencia",
        empty: "No hay transacciones registradas aún.",
        table: {
            date: "Fecha",
            description: "Descripción",
            payer: "Pagado Por",
            amount: "Monto"
        },
        form: {
            type: "Tipo",
            description: "Descripción",
            amount: "Monto (COP)",
            category: "Categoría",
            selectCategory: "Seleccionar Categoría",
            date: "Fecha",
            payer: "Pagado Por / Origen",
            submit: "Guardar Transacción",
            assignGoal: "Asignar a Meta (Opcional)",
            none: "-- Ninguna --",
            assignTo: "Para / Asignado a",
            splitAll: "Todos (Compartido)",
            splitCustom: "Personalizado (%)",
        }
    },
    accounts: {
        name: "Nombre de la Cuenta",
        type: "Tipo de Cuenta",
        balance: "Saldo Actual",
        privacy: {
            label: "Privacidad",
            shared: {
                title: "Compartida (Visible)",
                description: "Pareja ve balance y transacciones."
            },
            personal: {
                title: "Personal (Solo Saldo)",
                description: "Pareja ve SOLO el balance (sin transacciones)."
            },
            private: {
                title: "Privada (Oculta)",
                description: "Pareja no ve NADA."
            }
        },
        createTitle: "Nueva Cuenta Financiera"
    },
    settings: {
        title: "Configuración",
        profile: {
            title: "Tu Perfil",
            name: "Nombre",
            email: "Correo Electrónico"
        },
        members: {
            title: "Miembros del Grupo",
            addUser: "Agregar Usuario",
            removeUser: "Eliminar del Grupo",
            email: "Email",
            role: "Rol",
            actions: "Acciones",
            roles: {
                OWNER: "Propietario",
                ADMIN: "Administrador",
                MEMBER: "Miembro"
            }
        },
        security: {
            title: "Seguridad",
            changePassword: "Cambiar Contraseña",
            comingSoon: "Próximamente: Cambiar contraseña, autenticación de dos factores."
        },
        dangerZone: {
            title: "Zona de Peligro",
            description: "Acciones irreversibles. Procede con cuidado.",
            leaveGroup: "Abandonar Grupo",
            deleteAccount: "Eliminar Cuenta"
        },
        addUserModal: {
            title: "Agregar Usuario",
            name: "Nombre",
            email: "Email",
            password: "Contraseña",
            passwordHint: "Mínimo 8 caracteres",
            submit: "Crear Usuario",
            success: "¡Usuario creado exitosamente!"
        }
    }
} as const;
