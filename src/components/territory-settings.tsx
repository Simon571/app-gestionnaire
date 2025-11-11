"use client";

import * as React from 'react';

export default function TerritorySettings(): JSX.Element {
  const [lateMonths, setLateMonths] = React.useState<number>(3);
  const [mapOverlay, setMapOverlay] = React.useState<string>('ThinkGeo');
  const [geocodeProvider, setGeocodeProvider] = React.useState<string>('LocationIQ');
  const [showPanControls, setShowPanControls] = React.useState<boolean>(false);
  const [cacheEnabled, setCacheEnabled] = React.useState<boolean>(false);
  const [localizeAddress, setLocalizeAddress] = React.useState<boolean>(false);
  const [addressFormat, setAddressFormat] = React.useState<string>('<NUMÉRO> <RUE>');
  const [apartmentFormat, setApartmentFormat] = React.useState<string>('<APPARTEMENT> <SÉP>');
  const [customApartmentFormat, setCustomApartmentFormat] = React.useState<string>('');
  const [separator, setSeparator] = React.useState<string>('/');
  const [streetBeforeNumber, setStreetBeforeNumber] = React.useState<boolean>(false);
  const [addressLanguageEnabled, setAddressLanguageEnabled] = React.useState<boolean>(false);

  const [autoAssign, setAutoAssign] = React.useState<string>('Non');
  const [allowPublisherReturn, setAllowPublisherReturn] = React.useState<boolean>(false);
  const [allowTerritoryRequests, setAllowTerritoryRequests] = React.useState<boolean>(true);
  const [showNotes, setShowNotes] = React.useState<boolean>(false);
  const [allowNewAddresses, setAllowNewAddresses] = React.useState<boolean>(true);
  const [allowEditNotes, setAllowEditNotes] = React.useState<boolean>(true);
  const [navigateByCoordinates, setNavigateByCoordinates] = React.useState<boolean>(false);
  const [contactAttempts, setContactAttempts] = React.useState<number>(3);

  const [overlayChoice, setOverlayChoice] = React.useState<string>('');
  const [absenceDateMode, setAbsenceDateMode] = React.useState<string>('Jour court');
  const [displayMode, setDisplayMode] = React.useState<string>('En présentiel');

  const [addressButtons, setAddressButtons] = React.useState(
    [
      { label: "À la maison", enabled: true, color: '#6b21a8' },
      { label: 'Absent', enabled: true, color: '#6b21a8' },
      { label: 'Ne plus visiter', enabled: true, color: '#6b21a8' },
    ] as { label: string; enabled: boolean; color: string }[],
  );

  return (
    <div className="p-4">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left column - Scheduler */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">NW Scheduler</h2>
          <div className="bg-white shadow rounded p-4 space-y-3">
            <label className="flex items-center justify-between">
              <span>Territoires en retard</span>
              <select
                value={lateMonths}
                onChange={(e) => setLateMonths(Number(e.target.value))}
                className="ml-2 border rounded px-2 py-1"
              >
                {[1, 2, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>{m} mois</option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between">
              <span>Superposition de carte</span>
              <select
                value={mapOverlay}
                onChange={(e) => setMapOverlay(e.target.value)}
                className="ml-2 border rounded px-2 py-1"
              >
                  <option>ThinkGeo</option>
                  <option>ThinkGeo Dark</option>
                  <option>ThinkGeo Satellite</option>
                  <option>OpenStreetMap</option>
                  <option>MapBox</option>
                  <option>MapBox Satellite</option>
              </select>
            </label>

            <label className="flex items-center justify-between">
              <span>Fournisseur de géocodage</span>
              <select
                value={geocodeProvider}
                onChange={(e) => setGeocodeProvider(e.target.value)}
                className="ml-2 border rounded px-2 py-1"
              >
                <option>LocationIQ</option>
                <option>Google</option>
                <option>Nominatim</option>
              </select>
            </label>

            <label className="flex items-center justify-between">
              <span>Commandes de panoramique et de zoom</span>
              <label className="inline-flex items-center ml-2">
                <input type="checkbox" checked={showPanControls} onChange={(e) => setShowPanControls(e.target.checked)} className="mr-2" />
                <span>Montrer</span>
              </label>
            </label>

            <div className="flex items-center gap-2">
              <span>Cache de carte</span>
              <button className="ml-2 p-1 border rounded" title="Open cache">📁</button>
              <button className="p-1 border rounded" title="Clear cache">🗑️</button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={localizeAddress} onChange={(e) => setLocalizeAddress(e.target.checked)} />
                <span>Localiser l'adresse</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={streetBeforeNumber} onChange={(e) => setStreetBeforeNumber(e.target.checked)} />
                <span>Rue avant le numéro de la maison</span>
              </label>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground">Affichage de l'adresse</label>
              <select value={addressFormat} onChange={(e) => setAddressFormat(e.target.value)} className="border rounded px-2 py-1 w-full mt-1">
                <option>&lt;NUMÉRO&gt; &lt;RUE&gt;</option>
                <option>&lt;RUE&gt; &lt;NUMÉRO&gt;</option>
              </select>
              <div className="text-sm text-gray-600 mt-2">55 Paradise Street</div>
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={addressLanguageEnabled} onChange={(e) => setAddressLanguageEnabled(e.target.checked)} />
                <span>Langue de l'adresse</span>
                {addressLanguageEnabled && <span className="ml-2 text-sm text-gray-600">Activée</span>}
              </label>

              {/* Séparateur pour l'affichage des appartements - rendu ici pour être clairement visible */}
              <div className="flex items-center gap-2 mt-3">
                <label className="text-sm">Séparateur</label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  placeholder="Séparateur"
                  className="border rounded px-2 py-1 w-16 text-center ml-2"
                />
                <div className="text-sm text-gray-600 ml-3">Ex: 3{separator}55 Paradise Street</div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground">Affichage des appartements</label>
              <div className="mt-2">
                <select
                  value={apartmentFormat}
                  onChange={(e) => setApartmentFormat(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="&lt;APPARTEMENT&gt; &lt;SÉPARATEUR&gt; &lt;NUMÉRO&gt; &lt;RUE&gt;">&lt;APPARTEMENT&gt; &lt;SÉPARATEUR&gt; &lt;NUMÉRO&gt; &lt;RUE&gt;</option>
                  <option value="&lt;NUMÉRO&gt; &lt;RUE&gt; &lt;SÉPARATEUR&gt; &lt;APPARTEMENT&gt;">&lt;NUMÉRO&gt; &lt;RUE&gt; &lt;SÉPARATEUR&gt; &lt;APPARTEMENT&gt;</option>
                  <option value="&lt;RUE&gt; &lt;NUMÉRO&gt; &lt;SÉPARATEUR&gt; &lt;APPARTEMENT&gt;">&lt;RUE&gt; &lt;NUMÉRO&gt; &lt;SÉPARATEUR&gt; &lt;APPARTEMENT&gt;</option>
                  <option value="&lt;APPARTEMENT&gt; / &lt;NUMÉRO&gt; &lt;RUE&gt;">&lt;APPARTEMENT&gt; / &lt;NUMÉRO&gt; &lt;RUE&gt;</option>
                  <option value="custom">Personnalisé...</option>
                </select>

                {/* Separator moved to the address display section so it's easier to find */}

                {apartmentFormat === 'custom' && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customApartmentFormat}
                      onChange={(e) => setCustomApartmentFormat(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                      placeholder="Ex: <APPARTEMENT> / <NUMÉRO> <RUE>"
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-sm text-gray-600">Exemple: 3{separator}55 Paradise Street</div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle column - Publisher app */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">NW Publisher app</h2>
          <div className="bg-white shadow rounded p-4 space-y-3">
            <label className="flex items-center justify-between">
              <span>Autoriser l'auto-attribution de territoires</span>
              <select value={autoAssign} onChange={(e) => setAutoAssign(e.target.value)} className="ml-2 border rounded px-2 py-1">
                <option value="Non">Non</option>
                <option value="Anciens">Anciens</option>
                <option value="Anciens, Assistants">Anciens, Assistants</option>
                <option value="Anciens, Assistants, Pionniers">Anciens, Assistants, Pionniers</option>
                <option value="Proclamateurs">Proclamateurs</option>
              </select>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowPublisherReturn} onChange={(e) => setAllowPublisherReturn(e.target.checked)} />
              <span>Autoriser le rendu auto d'un territoire auto-attribué</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowTerritoryRequests} onChange={(e) => setAllowTerritoryRequests(e.target.checked)} />
              <span>Autoriser les demandes de territoire</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} />
              <span>Afficher les notes de travail du territoire</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowNewAddresses} onChange={(e) => setAllowNewAddresses(e.target.checked)} />
              <span>Autoriser la soumission de nouvelles adresses</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowEditNotes} onChange={(e) => setAllowEditNotes(e.target.checked)} />
              <span>Autoriser la modification des notes d'adresse</span>
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={navigateByCoordinates} onChange={(e) => setNavigateByCoordinates(e.target.checked)} />
              <span>Naviguer par coordonnées</span>
            </label>

            <label className="flex items-center justify-between">
              <span>Tentative de contact</span>
              <select value={contactAttempts} onChange={(e) => setContactAttempts(Number(e.target.value))} className="ml-2 border rounded px-2 py-1">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Right column - Publisher app Affiché / address buttons */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">NW Publisher app Affiché</h2>
          <div className="mb-2">
            <label className="block text-sm text-muted-foreground">Mode d'affichage</label>
            <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} className="border rounded px-2 py-1 w-full mt-1">
              <option>En présentiel</option>
              <option>Courrier</option>
              <option>Téléphone</option>
              <option>Entreprise</option>
            </select>
          </div>
          <div className="bg-white shadow rounded p-4 space-y-3">
            <label className="flex items-center justify-between">
              <span>Superposition de carte</span>
              <select value={overlayChoice} onChange={(e) => setOverlayChoice(e.target.value)} className="ml-2 border rounded px-2 py-1">
                <option value="">--</option>
                <option value="ThinkGeo">ThinkGeo</option>
                <option value="ThinkGeo Dark">ThinkGeo Dark</option>
                <option value="ThinkGeo Satellite">ThinkGeo Satellite</option>
                <option value="OpenStreetMap">OpenStreetMap</option>
                <option value="MapBox">MapBox</option>
                <option value="MapBox Satellite">MapBox Satellite</option>
              </select>
            </label>

            <label className="flex items-center justify-between">
              <span>Date de l'absence</span>
              <select value={absenceDateMode} onChange={(e) => setAbsenceDateMode(e.target.value)} className="ml-2 border rounded px-2 py-1">
                <option>Jour court</option>
                <option>Jour</option>
                <option>Date courte</option>
                <option>Date</option>
                <option>Aucun</option>
              </select>
            </label>

            <div className="border-l-4 border-blue-400 p-3 mt-2">
              <h3 className="font-semibold">Boutons d'adresse</h3>
              {addressButtons.map((b, i) => (
                <div key={i} className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={b.enabled} onChange={(e) => {
                      const next = [...addressButtons]; next[i].enabled = e.target.checked; setAddressButtons(next);
                    }} />
                    <span>{b.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={b.color} onChange={(e) => {
                      const next = [...addressButtons]; next[i].color = e.target.value; setAddressButtons(next);
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <h4 className="font-semibold">Affichage de l’adresse</h4>
              <label className="flex items-center gap-2 mt-2"><input type="checkbox" /> <span>Ville / Banlieue</span></label>
              <label className="flex items-center gap-2 mt-1"><input type="checkbox" /> <span>Code Postal</span></label>
              {/* Language of the address already controlled in the left column - removed duplicate here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

