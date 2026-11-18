
/* =====================================================
   ARTEMISA AI SMART BATCH UPLOAD
   Módulo frontend adicional
===================================================== */

(function () {
    'use strict';


    /* =====================================================
       1. CONFIGURACIÓN Y CONSTANTES
    ===================================================== */

    const API = window.ARTEMISA_API_URL ||
        'https://script.google.com/macros/s/AKfycbyy4H8o3wD8oXRdFMAv5oZHuWrbJ4gY_jNoR9MSBKLqQZbIuBiXJH8Dq4S-jAz6ZlZo/exec';

    const MAX_FILES = 100;
    const MAX_BYTES = 12 * 1024 * 1024;

    const TYPES = {
        Kitchen: [
            'Base Cabinet',
            'Wall Cabinet',
            'Cabinet',
            'Columna',
            'Countertop',
            'Custom Made',
            'Full Backsplash',
            'Island',
            'Outdoor',
            'Translucido',
            'Stone Wall'
        ],

        Bathroom: [
            'Custom Made',
            'Elegance',
            'Shower',
            'Sink Integrado',
            'Stone-clad walls',
            'Vanity',
            'Vanity Flotante',
            'Wall'
        ],

        Bar: [
            'Barra',
            'Coffee Bar',
            'Countertop',
            'Furniture'
        ],

        Bedroom: [
            'Furniture',
            'Murphy Bed'
        ],

        BBQ: [
            'Water Resistent Cabinets',
            'Countertop',
            'Stone Wall'
        ],

        Cabinets: [
            'Wall Cabinets',
            'Base Cabinets',
            'Custom Made',
            'Hardware'
        ],

        Closet: [
            'Corner',
            'Custom Made',
            'Library',
            'Shelves',
            'TV Stand',
            'Walking Closet'
        ],

        Fireplace: [
            'Furniture',
            'Stone'
        ],

        Furniture: [
            'Custom Made',
            'Drawer',
            'Furniture',
            'Living Room',
            'Office',
            'Special',
            'Table'
        ],

        Frontdesk: [
            'Countertop',
            'Custom Made',
            'Table'
        ],

        Laundry: [
            'Cabinet',
            'Panty',
            'Stone'
        ],

        LivinRoom: [
            'Cabinet',
            'Custom Made',
            'Panty',
            'Furniture',
            'Shelves'
        ],

        Marina: [
            'Barra',
            'Cabinet',
            'Panty',
            'Top'
        ],

        Office: [
            'Custom Made',
            'Closet',
            'Frontdesk',
            'Conference Room',
            'Table'
        ],

        Outdoor: [
            'Custom Made',
            'Kitchen',
            'BBQ',
            'Pool'
        ],

        Stair: [
            'Custom Made',
            'Wood',
            'Stone'
        ],

        Stone_Wall: [
            'Book Matching',
            'Columnas',
            'Custom Made',
            'Closet',
            'Fireplace',
            'Shower',
            'Translucido',
            'Wine Wall'
        ],

        Table: [
            'Custom Made',
            'Dinning',
            'Wood',
            'Stone'
        ],

        TV_Wall: [
            'Custom Made',
            'Wood',
            'Stone'
        ]
    };


    /* =====================================================
       2. VARIABLES GLOBALES DEL MÓDULO
    ===================================================== */

    let selectedFiles = [];
    let batchId = '';
    let queueItems = [];


    /* =====================================================
       3. FUNCIONES AUXILIARES
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    const esc = (s) => {
        return String(s == null ? '' : s).replace(
            /[&<>"']/g,
            c => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[c])
        );
    };


    /* =====================================================
       4. COMUNICACIÓN CON GOOGLE APPS SCRIPT
    ===================================================== */

    async function api(payload) {

        const r = await fetch(API, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const t = await r.text();

        let j;

        try {
            j = JSON.parse(t);

        } catch (_) {
            throw new Error(
                'Respuesta inválida de Apps Script: ' +
                t.slice(0, 250)
            );
        }

        if (!j.success) {
            throw new Error(j.error || 'Error del backend');
        }

        return j;
    }


    /* =====================================================
       5. CONVERSIÓN DE IMÁGENES A BASE64
    ===================================================== */

    function base64(file) {

        return new Promise((resolve, reject) => {

            const fr = new FileReader();

            fr.onload = () => {
                resolve(
                    String(fr.result).split(',')[1]
                );
            };

            fr.onerror = reject;

            fr.readAsDataURL(file);
        });
    }


    /* =====================================================
       6. CREACIÓN DEL BOTÓN PRINCIPAL
    ===================================================== */

    function addButton() {

        if ($('aiSmartUploadButton')) return;

        const legacy = document.querySelector(
            'button[onclick="openBatchWizard()"]'
        );

        const host = legacy
            ? legacy.parentElement
            : document.querySelector('.filters') || document.body;

        const b = document.createElement('button');

        b.id = 'aiSmartUploadButton';
        b.type = 'button';
        b.className = 'ai-smart-launch';

        b.textContent = '✦ AI Smart Batch Upload';

        b.addEventListener('click', openModal);

        host.appendChild(b);
    }


    /* =====================================================
       7. APERTURA DEL MODAL
    ===================================================== */

    function openModal() {

        if ($('aiSmartModal')) {
            $('aiSmartModal').remove();
        }

        const wrap = document.createElement('div');

        wrap.id = 'aiSmartModal';
        wrap.className = 'ai-smart-overlay';

        wrap.innerHTML = `
            <section class="ai-smart-panel"
                role="dialog"
                aria-modal="true"
                aria-label="AI Smart Batch Upload">

                <button class="ai-smart-close"
                    type="button"
                    data-close>×</button>

                <div class="ai-smart-kicker">
                    ARTEMISA CATALOG · AI ASSISTED
                </div>

                <h2>✦ AI Smart Batch Upload</h2>

                <p class="ai-smart-muted">
                    Sube fotografías, deja que Gemini identifique
                    los elementos visibles y revisa los datos antes
                    de publicarlos.
                </p>

                <div class="ai-smart-steps">
                    <span class="active">1 · Selección</span>
                    <span>2 · Análisis</span>
                    <span>3 · Revisión</span>
                    <span>4 · Publicación</span>
                </div>


                <!-- SELECCIÓN DE FOTOGRAFÍAS -->

                <div id="aiSmartSelectPane">

                    <div class="ai-smart-resume">

                        <label class="ai-smart-label">
                            Continuar un lote anterior
                        </label>

                        <div class="ai-smart-resume-row">

                            <select id="aiSmartPreviousBatch"
                                class="ai-smart-input">

                                <option value="">
                                    Cargando lotes…
                                </option>

                            </select>

                            <button id="aiSmartOpenPrevious"
                                class="ai-smart-secondary"
                                type="button">

                                Abrir lote

                            </button>

                        </div>
                    </div>


                    <label class="ai-smart-label">
                        Proyecto (puedes completarlo después)
                    </label>

                    <input id="aiSmartProject"
                        class="ai-smart-input"
                        placeholder="Nombre del proyecto / GENERAL">


                    <!-- ÁREA DRAG & DROP -->

                    <div id="aiSmartDrop" class="ai-smart-drop">

                        <div class="ai-smart-folder">▣</div>

                        <b>Arrastra aquí tus fotografías</b>

                        <span>
                            o haz clic para seleccionar · JPG, PNG, WEBP
                            · máximo 12 MB cada una
                        </span>

                        <input id="aiSmartFiles"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            hidden>

                    </div>


                    <div id="aiSmartFileList"
                        class="ai-smart-filelist">

                        No hay fotografías seleccionadas.

                    </div>


                    <button id="aiSmartStart"
                        class="ai-smart-primary"
                        type="button"
                        disabled>

                        Subir y analizar fotografías →

                    </button>

                </div>


                <!-- PROGRESO DEL ANÁLISIS -->

                <div id="aiSmartProgressPane" hidden>

                    <div class="ai-smart-progress-title"
                        id="aiSmartProgressTitle">

                        Preparando lote…

                    </div>

                    <div class="ai-smart-progress">

                        <i id="aiSmartProgressBar"></i>

                    </div>

                    <div id="aiSmartProgressText"
                        class="ai-smart-muted">
                    </div>

                </div>


                <!-- REVISIÓN DE RESULTADOS -->

                <div id="aiSmartReviewPane" hidden>

                    <div class="ai-smart-review-head">

                        <div>

                            <h3>Revisión de resultados</h3>

                            <p class="ai-smart-muted">
                                Verifica los campos detectados.
                                Proyecto y agrupación se completan
                                manualmente cuando corresponda.
                            </p>

                        </div>

                        <button id="aiSmartReload"
                            class="ai-smart-secondary"
                            type="button">

                            Actualizar

                        </button>

                    </div>


                    <div id="aiSmartCards"
                        class="ai-smart-cards">
                    </div>


                    <!-- BARRA DE PUBLICACIÓN -->

                    <div class="ai-smart-publishbar">

                        <label>
                            <input type="checkbox"
                                id="aiSmartSelectAll">

                            Seleccionar todas las aprobadas
                        </label>

                        <button id="aiSmartPublish"
                            class="ai-smart-primary"
                            type="button">

                            Publicar aprobadas en CATALOGO

                        </button>

                    </div>

                </div>


                <!-- MENSAJES -->

                <div id="aiSmartMessage"
                    class="ai-smart-message"
                    aria-live="polite">
                </div>

            </section>
        `;


        /* INSERTAR MODAL EN EL DOCUMENTO */

        document.body.appendChild(wrap);


        /* CERRAR MODAL */

        wrap.addEventListener('click', e => {

            if (
                e.target === wrap ||
                e.target.closest('[data-close]')
            ) {
                wrap.remove();
            }
        });


        /* EVENTOS DE ARCHIVOS */

        const input = $('aiSmartFiles');
        const drop = $('aiSmartDrop');

        drop.addEventListener('click', () => {
            input.click();
        });

        input.addEventListener('change', () => {
            setFiles(input.files);
        });


        /* DRAG AND DROP */

        ['dragenter', 'dragover'].forEach(n => {

            drop.addEventListener(n, e => {

                e.preventDefault();

                drop.classList.add('drag');

            });
        });


        ['dragleave', 'drop'].forEach(n => {

            drop.addEventListener(n, e => {

                e.preventDefault();

                drop.classList.remove('drag');

            });
        });


        drop.addEventListener('drop', e => {
            setFiles(e.dataTransfer.files);
        });


        /* EVENTOS DE BOTONES */

        $('aiSmartStart').addEventListener(
            'click',
            startBatch
        );

        $('aiSmartReload').addEventListener(
            'click',
            loadReview
        );

        $('aiSmartPublish').addEventListener(
            'click',
            publishSelected
        );

        $('aiSmartOpenPrevious').addEventListener(
            'click',
            openPreviousBatch
        );


        /* CARGAR LOTES ANTERIORES */

        loadRecentBatches();


        /* SELECCIONAR TODAS LAS APROBADAS */

        $('aiSmartSelectAll').addEventListener('change', e => {

            document.querySelectorAll('.ai-smart-approve')
                .forEach(c => {

                    if (!c.disabled) {
                        c.checked = e.target.checked;
                    }

                });

        });

    }


    /* =====================================================
       8. CARGAR LOTES ANTERIORES
    ===================================================== */

    async function loadRecentBatches() {

        try {

            const r = await api({
                action: 'AI_LIST_BATCHES'
            });

            const sel = $('aiSmartPreviousBatch');

            if (!sel) return;

            sel.innerHTML =
                '<option value="">Seleccionar lote guardado…</option>' +

                (r.batches || []).map(b => `
                    <option value="${esc(b.batchId)}">
                        ${esc(b.batchId)}
                        · ${b.total} fotos
                        · ${b.analyzed} analizadas
                        · ${b.published} publicadas
                    </option>
                `).join('');

        } catch (e) {

            const sel = $('aiSmartPreviousBatch');

            if (sel) {
                sel.innerHTML =
                    '<option value="">No se pudieron cargar los lotes</option>';
            }

        }

    }


    /* =====================================================
       9. ABRIR UN LOTE ANTERIOR
    ===================================================== */

    async function openPreviousBatch() {

        const id = $('aiSmartPreviousBatch').value;

        if (!id) {

            message('Selecciona un lote anterior.', true);

            return;
        }

        batchId = id;

        $('aiSmartSelectPane').hidden = true;
        $('aiSmartProgressPane').hidden = false;

        progress(
            0,
            1,
            'Recuperando lote guardado…'
        );

        await loadReview();

    }


    /* =====================================================
       10. SELECCIÓN Y VALIDACIÓN DE FOTOGRAFÍAS
    ===================================================== */

    function setFiles(files) {

        selectedFiles = Array.from(files || []);

        const valid = selectedFiles.filter(f =>
            /^image\/(jpeg|png|webp)$/.test(f.type) &&
            f.size <= MAX_BYTES
        );

        $('aiSmartStart').disabled =
            !valid.length || valid.length > MAX_FILES;


        $('aiSmartFileList').innerHTML = `
            <b>${valid.length} fotografía(s) válidas</b>

            ${
                selectedFiles.length !== valid.length
                    ? ` · ${selectedFiles.length - valid.length}
                       rechazadas por formato o tamaño`
                    : ''
            }

            <div class="ai-smart-filenames">

                ${
                    valid.slice(0, 12)
                        .map(f => '• ' + esc(f.name))
                        .join('<br>')
                }

                ${
                    valid.length > 12
                        ? `<br>… y ${valid.length - 12} más`
                        : ''
                }

            </div>
        `;

        selectedFiles = valid;

    }


    /* =====================================================
       11. ACTUALIZAR BARRA DE PROGRESO
    ===================================================== */

    function progress(done, total, title) {

        $('aiSmartProgressTitle').textContent = title;

        $('aiSmartProgressBar').style.width =
            (total ? Math.round(done / total * 100) : 0) + '%';

        $('aiSmartProgressText').textContent =
            done + ' de ' + total + ' fotografías';

    }


    /* =====================================================
       12. CREAR LOTE Y SUBIR FOTOGRAFÍAS
    ===================================================== */

    async function startBatch() {

        if (!selectedFiles.length) return;

        $('aiSmartStart').disabled = true;

        $('aiSmartSelectPane').hidden = true;
        $('aiSmartProgressPane').hidden = false;


        try {

            /* CREAR LOTE */

            const created = await api({
                action: 'AI_CREATE_BATCH',
                fileCount: selectedFiles.length,
                project: $('aiSmartProject').value.trim()
            });

            batchId = created.batchId;


            /* SUBIR FOTOGRAFÍAS A GOOGLE DRIVE */

            const ids = [];

            for (let i = 0; i < selectedFiles.length; i++) {

                const f = selectedFiles[i];

                progress(
                    i,
                    selectedFiles.length,
                    'Guardando fotografías en Google Drive…'
                );

                const r = await api({

                    action: 'AI_UPLOAD_FILE',

                    batchId: batchId,

                    projectHint: $('aiSmartProject').value.trim(),

                    fileName: f.name,

                    mimeType: f.type,

                    file: await base64(f)

                });

                ids.push(r.queueId);

            }


            /* ANÁLISIS CON GEMINI */

            for (let i = 0; i < ids.length; i++) {

                progress(
                    i,
                    ids.length,
                    'Gemini está analizando las fotografías…'
                );

                try {

                    await api({
                        action: 'AI_ANALYZE_FILE',
                        queueId: ids[i]
                    });

                } catch (err) {

                    console.warn(
                        'AI analysis failed',
                        ids[i],
                        err
                    );

                }

            }


            /* FINALIZAR ANÁLISIS */

            progress(
                ids.length,
                ids.length,
                'Análisis terminado. Preparando revisión…'
            );

            await loadReview();


        } catch (err) {

            message(err.message, true);

            $('aiSmartSelectPane').hidden = false;

        }

    }


    /* =====================================================
       13. MOSTRAR MENSAJES Y ERRORES
    ===================================================== */

    function message(text, error) {

        $('aiSmartMessage').textContent = text;

        $('aiSmartMessage').className =
            'ai-smart-message ' + (error ? 'error' : '');

    }


    /* =====================================================
       14. CARGAR RESULTADOS PARA REVISIÓN
    ===================================================== */

    async function loadReview() {

        if (!batchId) return;

        const r = await api({
            action: 'AI_LIST_BATCH',
            batchId: batchId
        });

        queueItems = r.items || [];

        $('aiSmartProgressPane').hidden = true;
        $('aiSmartReviewPane').hidden = false;

        renderCards();

    }


    /* =====================================================
       15. GENERAR OPCIONES DE LOS SELECT
    ===================================================== */

    function selectOptions(values, current, placeholder) {

        return `
            <option value="">${placeholder}</option>

            ${
                values.map(v => `
                    <option value="${esc(v)}"
                        ${v === current ? 'selected' : ''}>

                        ${esc(v)}

                    </option>
                `).join('')
            }
        `;

    }


    /* =====================================================
       16. RENDERIZAR TARJETAS DE RESULTADOS
    ===================================================== */

    function renderCards() {

        $('aiSmartCards').innerHTML = queueItems.map(item => {

            const a =
                item.REVIEW_DATA &&
                Object.keys(item.REVIEW_DATA).length
                    ? item.REVIEW_DATA
                    : (item.AI_RESULT || {});


            /* ESTADO DE APROBACIÓN */

           const approved = !!a.APPROVED;

            const aiStatus = String(item.AI_STATUS || '')
                .trim()
                .toUpperCase();
            
            const uncertainFields = Array.isArray(a.UNCERTAIN_FIELDS)
                ? a.UNCERTAIN_FIELDS
                : [];
            
            const observations = Array.isArray(a.OBSERVATIONS)
                ? a.OBSERVATIONS
                : [];

            /* CALCULAR CONFIANZA */

            const conf = a.CONFIDENCE || {};

            const confidence = Object.keys(conf).length
                ? Math.round(
                    Object.values(conf).reduce(
                        (x, y) => x + Number(y || 0),
                        0
                    ) / Object.keys(conf).length * 100
                )
                : 0;


            /* VISTA PREVIA DE GOOGLE DRIVE */

            const preview = item.LINK
                ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.FILE_ID)}&sz=w320`
                : '';


            /* CREAR TARJETA */

            return `

                <article class="ai-smart-card"
                    data-qid="${esc(item.QUEUE_ID)}">


                    <!-- IMAGEN -->

                    <div class="ai-smart-thumb">

                        ${
                            preview
                                ? `
                                    <img
                                        src="${preview}"
                                        alt="${esc(item.FICHERO)}"
                                        loading="lazy">
                                `
                                : ''
                        }

                    </div>


                    <div class="ai-smart-cardbody">


                        <!-- TÍTULO Y ESTADO -->

                        <div class="ai-smart-cardtitle">

                            <b>${esc(item.FICHERO)}</b>

                            <span class="ai-smart-status ${aiStatus.toLowerCase()}">

                              ${esc(aiStatus || 'UNKNOWN')}

                            </span>

                        </div>


                        <!-- ERRORES -->

                        ${
                            item.ERROR
                                ? `
                                    <p class="ai-smart-error">
                                        ${esc(item.ERROR)}
                                    </p>
                                `
                                : ''
                        }


                        <!-- CAMPOS EDITABLES -->

                        <div class="ai-smart-fieldgrid">


                            <label>
                                PROYECTO

                                <input
                                    data-field="PROJECT"
                                    value="${esc(a.PROJECT || item.PROJECT_HINT || '')}"
                                    placeholder="Nombre del proyecto">
                            </label>


                            <label>
                                GROUP ID

                                <input
                                    data-field="GROUP_ID"
                                    value="${esc(a.GROUP_ID || item.GROUP_ID || '')}"
                                    placeholder="Ej. KITCHEN-01">
                            </label>


                            <label>
                                STONE

                                <input
                                    data-field="STONE"
                                    value="${esc(a.STONE || '')}"
                                    placeholder="Tipo de piedra">
                            </label>


                            <label>
                                TIPO

                                <select data-field="TIPO">

                                    ${selectOptions(
                                        Object.keys(TYPES),
                                        a.TIPO,
                                        'Seleccionar tipo'
                                    )}

                                </select>
                            </label>


                            <label>
                                SUBTIPO

                                <select data-field="SUBTIPO">

                                    ${selectOptions(
                                        TYPES[a.TIPO] || [],
                                        a.SUBTIPO,
                                        'Seleccionar subtipo'
                                    )}

                                </select>
                            </label>


                            <label>
                                COLOURS

                                <input
                                    data-field="COLOURS"
                                    value="${esc(a.COLOURS || '')}"
                                    placeholder="White, Gray...">
                            </label>


                            <label>
                                MATERIALES

                                <input
                                    data-field="MATERIALES"
                                    value="${esc(a.MATERIALES || '')}"
                                    placeholder="Wood, Glass...">
                            </label>


                            <label class="wide">
                                MEMO

                                <textarea data-field="MEMO">${esc(a.MEMO || '')}</textarea>
                            </label>


                            <label class="wide">
                                LOOKING FOR

                                <textarea data-field="LOOKINGFOR">${esc(a.LOOKINGFOR || '')}</textarea>
                            </label>


                        </div>


                        <!-- OBSERVACIONES DE GEMINI -->

                        <div class="ai-smart-observations">

                            ${
                                 uncertainFields.length
                              
                                    ? `
                                        <b>Verificar:</b>
                                        ${esc((a.UNCERTAIN_FIELDS || []).join(', '))}
                                    `
                                    : ''
                            }

                            ${
                               observations
                                  .map(x => esc(String(x)))
                                  .join(' · ')
                            }

                            ${
                                confidence
                                    ? `
                                        <span>
                                            Confianza media orientativa:
                                            ${confidence}%
                                        </span>
                                    `
                                    : ''
                            }

                        </div>


                        <!-- ACCIONES DE LA TARJETA -->

                        <div class="ai-smart-cardactions">

                            <label>

                              <input
                                  class="ai-smart-approve"
                                  type="checkbox"
                                  ${approved ? 'checked' : ''}
                                  ${!['ANALYZED', 'ERROR'].includes(aiStatus) ? 'disabled' : ''}>
                                  
                                Revisado y aprobado

                            </label>


                            <button
                                type="button"
                                class="ai-smart-save">

                                Guardar revisión

                            </button>

                        </div>


                    </div>

                </article>

            `;

        }).join('');


        /* CAMBIAR SUBTIPO SEGÚN TIPO */

        $('aiSmartCards')
            .querySelectorAll('[data-field="TIPO"]')
            .forEach(sel => {

                sel.addEventListener('change', e => {

                    const card = e.target.closest('.ai-smart-card');

                    const sub = card.querySelector(
                        '[data-field="SUBTIPO"]'
                    );

                    sub.innerHTML = selectOptions(
                        TYPES[e.target.value] || [],
                        '',
                        'Seleccionar subtipo'
                    );

                });

            });


        /* GUARDAR REVISIÓN INDIVIDUAL */

        $('aiSmartCards')
            .querySelectorAll('.ai-smart-save')
            .forEach(btn => {

                btn.addEventListener('click', async () => {

                    const card = btn.closest('.ai-smart-card');

                    try {

                        await saveCard(card);

                        btn.textContent = 'Guardado ✓';

                        setTimeout(() => {

                            btn.textContent = 'Guardar revisión';

                        }, 1200);

                    } catch (e) {

                        message(e.message, true);

                    }

                });

            });

    }


    /* =====================================================
       17. GUARDAR REVISIÓN DE UNA FOTOGRAFÍA
    ===================================================== */

    async function saveCard(card) {

        const review = {};

        card.querySelectorAll('[data-field]').forEach(el => {

            review[el.dataset.field] = el.value.trim();

        });


        review.APPROVED = card.querySelector(
            '.ai-smart-approve'
        ).checked;


        await api({

            action: 'AI_SAVE_REVIEW',

            queueId: card.dataset.qid,

            review: review

        });


        /* ACTUALIZAR ESTADO LOCAL */

        const item = queueItems.find(
            x => x.QUEUE_ID === card.dataset.qid
        );

        if (item) {

            item.REVIEW_DATA = review;

            item.REVIEW_STATUS = review.APPROVED
                ? 'APPROVED'
                : 'PENDING';

        }

    }


    /* =====================================================
       18. PUBLICAR FOTOGRAFÍAS APROBADAS EN CATALOGO
    ===================================================== */

    async function publishSelected() {

        const cards = Array.from(
            document.querySelectorAll('.ai-smart-card')
        );


        /* OBTENER TARJETAS SELECCIONADAS */

        const selected = cards.filter(c =>
            c.querySelector('.ai-smart-approve').checked
        );


        if (!selected.length) {

            message(
                'Marca como aprobadas las fotografías que deseas publicar.',
                true
            );

            return;
        }


        try {

            /* GUARDAR TODAS LAS REVISIONES */

            for (const c of selected) {

                await saveCard(c);

            }


            /* PUBLICAR EN CATALOGO */

            const r = await api({

                action: 'AI_PUBLISH',

                queueIds: selected.map(c => c.dataset.qid)

            });


            /* CONFIRMAR PUBLICACIÓN */

            message(
                `${r.count} fotografía(s) publicadas correctamente en CATALOGO.`
            );


            /* ACTUALIZAR REVISIÓN */

            await loadReview();


            /* ACTUALIZAR GALERÍA SI EXISTE */

            if (typeof window.loadPhotos === 'function') {

                window.loadPhotos();

            }


        } catch (e) {

            message(e.message, true);

        }

    }


    /* =====================================================
       19. INICIALIZACIÓN DEL MÓDULO
    ===================================================== */

    document.addEventListener(
        'DOMContentLoaded',
        addButton
    );


    if (document.readyState !== 'loading') {

        addButton();

    }


    /* FUNCIÓN GLOBAL PARA ABRIR EL MODAL */

    window.openAISmartBatchUpload = openModal;


})();

