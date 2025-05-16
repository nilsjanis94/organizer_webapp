// Einfache Debugging-Funktion
function showError(message: string, error: unknown): void {
  console.error(message, error);
  
  // Fehler im DOM anzeigen
  try {
    const errorDiv = document.createElement('div');
    errorDiv.style.backgroundColor = '#ffcccc';
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    errorDiv.style.margin = '20px';
    errorDiv.style.border = '1px solid red';
    errorDiv.style.borderRadius = '5px';
    
    const errorTitle = document.createElement('h3');
    errorTitle.textContent = 'Angular Bootstrap Fehler:';
    errorDiv.appendChild(errorTitle);
    
    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorDiv.appendChild(errorMessage);
    
    if (error) {
      const errorDetails = document.createElement('pre');
      errorDetails.textContent = typeof error === 'object' ? 
        JSON.stringify(error, null, 2) : String(error);
      errorDiv.appendChild(errorDetails);
    }
    
    document.body.appendChild(errorDiv);
    
    // Lade-Anzeige ausblenden
    const loadingDiv = document.querySelector('.pre-bootstrap') as HTMLElement;
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  } catch (err) {
    console.error('Fehler beim Anzeigen des Fehlers im DOM:', err);
  }
}

// Bootstrap versuchen mit verbessertem Error-Handling
try {
  console.log('Angular Bootstrap wird versucht...');
  
  import('./app/app.component').then(module => {
    console.log('App-Komponente geladen:', module);
    const AppComponent = module.AppComponent;
    
    import('./app/app.config').then(configModule => {
      console.log('App-Konfiguration geladen:', configModule);
      const appConfig = configModule.appConfig;
      
      import('@angular/platform-browser').then(platformModule => {
        console.log('Platform-Browser-Modul geladen');
        const { bootstrapApplication } = platformModule;
        
        console.log('Starte Bootstrap mit:', { AppComponent, appConfig });
        
        bootstrapApplication(AppComponent, appConfig)
          .then(() => {
            console.log('Angular Bootstrap erfolgreich!');
          })
          .catch(err => {
            showError('Bootstrap fehlgeschlagen', err);
          });
      }).catch(err => showError('Fehler beim Laden des Platform-Moduls', err));
    }).catch(err => showError('Fehler beim Laden der App-Konfiguration', err));
  }).catch(err => showError('Fehler beim Laden der App-Komponente', err));
} catch (err) {
  showError('Kritischer Bootstrap-Fehler', err);
}
