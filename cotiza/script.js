// URL de tu Apps Script (reemplaza con la URL de tu despliegue)
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbyF-kCTNjRzePe0SLrxZLjXmsh4d1NeRapUAtJVkaairtjDDzzKtkfsUFMxC-Jx_ApW/exec';

// Información de sucursales con sus ciudades y números WhatsApp
const branchInfo = {
  queretaro:      { city: 'Querétaro, México',     phone: '524424710760' },
  aguascalientes: { city: 'Aguascalientes, México', phone: '524492656569' },
  monterrey:      { city: 'Monterrey, México',      phone: '528123575710' }
};

window.addEventListener('DOMContentLoaded', () => {
  // 1) Estilos dinámicos para ocultar mapas vacíos y ajustar icono
  const style = document.createElement('style');
  style.innerHTML = `
    .map-container:empty { display: none; }
    #waToggle i { font-size: 28px; }
  `;
  document.head.appendChild(style);

  // 2) Muestra vista previa del estado en el paso de dirección
  function previewStateMap(formId, mapId) {
    const sel = document.querySelector(`#${formId} select[name="sucursal"]`);
    const mapContainer = document.getElementById(mapId);
    const city = branchInfo[sel.value]?.city;
    if (!city) return;
    mapContainer.innerHTML = `
      <iframe
        src="https://maps.google.com/maps?q=${encodeURIComponent(city)}&z=6&output=embed"
        width="100%" height="200" frameborder="0" style="border:0" allowfullscreen>
      </iframe>`;
  }

  // 3) Wizard multi-step con preview en paso de dirección (índice 5)
  function setupWizard(formId, startBtnId = null) {
    const bienvenida = document.getElementById('bienvenida');
    const form       = document.getElementById(formId);
    const steps      = Array.from(form.querySelectorAll('.step'));
    let current = 0;

    function show(i) {
      steps.forEach((s, j) => s.classList.toggle('active', j === i));
      current = i;
      if (i === 5) {
        const mapId = formId === 'formOrdinario' ? 'mapaDireccion' : 'mapaDireccionExtra';
        previewStateMap(formId, mapId);
      }
    }

    if (startBtnId) {
      document.getElementById(startBtnId).onclick = () => {
        bienvenida.classList.remove('active');
        form.classList.add('active');
        show(0);
      };
    } else {
      form.classList.add('active');
      show(0);
    }

    form.querySelectorAll('.next').forEach(btn => {
      if (btn.id === 'btnNextDireccion' || btn.id === 'btnNextDireccionExtra') return;
      btn.onclick = () => {
        const campos = steps[current].querySelectorAll('input, select');
        for (let campo of campos) {
          if (!campo.checkValidity()) {
            campo.reportValidity();
            return;
          }
        }
        if (current < steps.length - 1) show(current + 1);
      };
    });

    form.querySelectorAll('.back').forEach(btn => {
      btn.onclick = () => {
        if (current > 0) show(current - 1);
      };
    });
  }

  setupWizard('formOrdinario',    'btnOrdinaria');
  setupWizard('formExtraordinaria','btnExtraordinaria');

  // 4) IP pública y geolocalización oculta
  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(d => {
      document.getElementById('ipUsuario').value = d.ip;
      document.getElementById('ipExtra').value   = d.ip;
    });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      ['latitudUsuario','latExtra'].forEach(id => document.getElementById(id).value = lat);
      ['longitudUsuario','lonExtra'].forEach(id => document.getElementById(id).value = lon);

      let detected = '';
      if (lat > 20 && lat < 21)       detected = 'queretaro';
      else if (lat > 21 && lat < 23)  detected = 'aguascalientes';
      else if (lat > 24 && lat < 26)  detected = 'monterrey';

      document.querySelectorAll('select[name="sucursal"]').forEach(sel => {
        sel.value = detected;
        sel.dispatchEvent(new Event('change'));
      });
    });
  }

  // 5) Al cambiar sucursal, limpia mapas
  document.querySelectorAll('select[name="sucursal"]').forEach(sel => {
    const map = sel.closest('form').querySelector('.map-container');
    sel.addEventListener('change', () => map.innerHTML = '');
  });

  // ... continúa en la Parte 2
});

window.addEventListener('DOMContentLoaded', () => {
    // 6) Mapa dinámico al escribir dirección
    const dirOrd = document.getElementById('direccionServicio');
    const mapOrd = document.getElementById('mapaDireccion');
    dirOrd.addEventListener('input', () => {
      const sel  = document.querySelector('#formOrdinario select[name="sucursal"]');
      const city = branchInfo[sel.value].city;
      const addr = dirOrd.value.trim();
      if (!addr) {
        previewStateMap('formOrdinario','mapaDireccion');
      } else {
        const full = `${addr}, ${city}`;
        mapOrd.innerHTML = `
          <iframe
            src="https://maps.google.com/maps?q=${encodeURIComponent(full)}&z=13&output=embed"
            width="100%" height="200" frameborder="0" style="border:0" allowfullscreen>
          </iframe>`;
      }
    });
  
    const dirExt = document.getElementById('direccionExtra');
    const mapExt = document.getElementById('mapaDireccionExtra');
    dirExt.addEventListener('input', () => {
      const sel  = document.querySelector('#formExtraordinaria select[name="sucursal"]');
      const city = branchInfo[sel.value].city;
      const addr = dirExt.value.trim();
      if (!addr) {
        previewStateMap('formExtraordinaria','mapaDireccionExtra');
      } else {
        const full = `${addr}, ${city}`;
        mapExt.innerHTML = `
          <iframe
            src="https://maps.google.com/maps?q=${encodeURIComponent(full)}&z=13&output=embed"
            width="100%" height="200" frameborder="0" style="border:0" allowfullscreen>
          </iframe>`;
      }
    });

    const fileInput = document.querySelector('#formExtraordinaria input[name="imagen"]');
    const fileList  = document.getElementById('fileListExtra');

    // cuando cambian los archivos:
    fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files);
    fileList.innerHTML = '';  // limpia lista

    // genera la vista previa de nombres
    files.forEach(f => {
        const line = document.createElement('div');
        line.textContent = `Imagen ${f.name} adjuntada`;
        fileList.appendChild(line);
    });

    // validación: mínimo 1, máximo 3
    if (files.length < 1 || files.length > 3) {
        fileInput.setCustomValidity('Debes seleccionar entre 1 y 3 imágenes.');
    } else {
        fileInput.setCustomValidity('');
    }
    });
  
    // 7) Helpers para avanzar al siguiente paso tras el mapa de dirección
    function goNextForm(formId) {
      const form  = document.getElementById(formId);
      const steps = Array.from(form.querySelectorAll('.step'));
      const idx   = steps.findIndex(s => s.classList.contains('active'));
      if (idx >= 0 && idx < steps.length - 1) {
        steps[idx].classList.remove('active');
        steps[idx + 1].classList.add('active');
      }
    }
    document.getElementById('btnNextDireccion').onclick        = () => goNextForm('formOrdinario');
    document.getElementById('btnNextDireccionExtra').onclick   = () => goNextForm('formExtraordinaria');
  
    // 8) Contenedores dinámicos (solo ordinario)
    const contData = {
      "1.1 m³": { medidas:"134×107×137 cm", carga:"300 kg", material:"Plástico",      imagen:"https://i.ibb.co/r5dbL89/contenedor1.jpg" },
      "1.5 m³": { medidas:"140×110×140 cm", carga:"400 kg", material:"Plástico (prov.)",imagen:"https://i.ibb.co/r5dbL89/contenedor1.jpg" },
      "3 m³":   { medidas:"185×120×125 cm", carga:"500 kg", material:"Acero",          imagen:"https://i.ibb.co/6XjGBQm/contenedor2.jpg" },
      "6 m³":   { medidas:"190×200×150 cm", carga:"500 kg", material:"Metal",          imagen:"https://i.ibb.co/6XjGBQm/contenedor2.jpg" }
    };
    const formO     = document.getElementById('formOrdinario');
    const selSucO   = formO.querySelector('select[name="sucursal"]');
    const selCont   = formO.querySelector('select[name="contenedor"]');
    const infoContO = document.getElementById('infoContenedorOrdi');
    const msgContO  = document.getElementById('mensajeContenedorOrdi');
    const emailCO   = document.getElementById('correoContenedorOrdi');
    const correoV   = document.getElementById('correoVisitas');
  
    function obtenerCorreoSucursal(k) {
      if (k === 'queretaro')      return 'calidadqro@mediosconvalor.com';
      if (k === 'aguascalientes') return 'ventasags@mediosconvalor.com';
      if (k === 'monterrey')      return 'administracionmty@mediosconvalor.com';
      return '';
    }
  
    function fillContenedores() {
      const key = selSucO.value;
      const tipos = key === 'queretaro'
        ? ["1.1 m³","3 m³","6 m³"]
        : ["1.1 m³","1.5 m³","3 m³","6 m³"];
      selCont.innerHTML = '<option value="">Selecciona un contenedor</option>';
      tipos.forEach(t => selCont.append(new Option(t, t)));
      infoContO.innerHTML = '';
      msgContO.style.display = 'none';
    }
  
    selSucO.addEventListener('change', () => {
      fillContenedores();
      correoV.textContent = obtenerCorreoSucursal(selSucO.value);
    });
    fillContenedores();
  
    selCont.addEventListener('change', () => {
      const d = contData[selCont.value];
      if (!d) return;
      infoContO.innerHTML = `
        <strong>Medidas:</strong> ${d.medidas}<br>
        <strong>Carga:</strong> ${d.carga}<br>
        <strong>Material:</strong> ${d.material}<br>
        <img src="${d.imagen}" alt="Contenedor">
      `;
      emailCO.textContent = obtenerCorreoSucursal(selSucO.value);
      msgContO.style.display = 'block';
    });
  
    // 9) Advertencia visitas
    formO.querySelector('select[name="frecuencia"]').addEventListener('change', e => {
      const v = +e.target.value;
      document.getElementById('mensajeVisitas').style.display = (v < 2 || v > 6) ? 'block' : 'none';
    });
  
    // 10) Popup de resultado y envío
    function mostrarPopup(ok) {
      const pop     = document.getElementById('popup'),
            emoji   = document.getElementById('popupEmoji'),
            mensaje = document.getElementById('popupMensaje'),
            opts    = document.getElementById('popupOpciones');
      emoji.textContent   = ok ? '✅' : '❌';
      mensaje.textContent = ok
        ? '¡Formulario enviado correctamente!'
        : 'Error al enviar. Intenta más tarde.';
      opts.innerHTML = '<button id="cerrarPopup">Cerrar</button>';
      document.getElementById('cerrarPopup').onclick = () => location.reload();
      pop.style.display = 'flex';
    }
  
    function enviarFormulario(data) {
      fetch(URL_APPS_SCRIPT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(r => r.json())
      .then(res => mostrarPopup(res.status === 'success'))
      .catch(() => mostrarPopup(false));
    }
  
    // Envío ordinaria
    formO.addEventListener('submit', e => {
      e.preventDefault();
      enviarFormulario(Object.fromEntries(new FormData(formO)));
    });
  
    // Envío extraordinaria (con Base64 de imagen)
    const formE = document.getElementById('formExtraordinaria');
    formE.addEventListener('submit', e => {
      e.preventDefault();
      const fileIn = formE.querySelector('input[name="imagen"]');
      if (!fileIn.files.length) {
        alert('Por favor sube una imagen de los residuos.');
        return;
      }
      const data = Object.fromEntries(new FormData(formE));
      const reader = new FileReader();
      reader.onload = () => {
        data.imagen = reader.result;
        enviarFormulario(data);
      };
      reader.readAsDataURL(fileIn.files[0]);
    });
  
    // 11) Menú WhatsApp con mensaje predefinido
    const waToggle   = document.getElementById('waToggle');
    const waList     = document.getElementById('waList');
    const defaultMsg = encodeURIComponent('Te escribo por el tema de una cotización');
  
    waToggle.onclick = () => {
      waList.style.display = waList.style.display === 'block' ? 'none' : 'block';
    };
  
    waList.querySelectorAll('li').forEach(li => {
      li.onclick = () => {
        const info = branchInfo[li.dataset.key];
        if (info) {
          window.open(`https://wa.me/${info.phone}?text=${defaultMsg}`, '_blank');
        }
      };
    });
  });  