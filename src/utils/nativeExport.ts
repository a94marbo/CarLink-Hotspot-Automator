import { AppSettings, BluetoothDevice } from '../types';

export function generateTaskerProfileXml(
  triggerDevices: BluetoothDevice[],
  settings: AppSettings
): string {
  const deviceNames = triggerDevices.length > 0
    ? triggerDevices.map(d => d.name).join('/')
    : 'Car Bluetooth';

  const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<TaskerData sr="" dvi="1" tv="6.2.22">
  <!-- Profile: Auto Hotspot for Car Bluetooth -->
  <Profile sr="prof1" ve="2">
    <cdate>1710000000000</cdate>
    <edate>1710000000000</edate>
    <id>1001</id>
    <mid0>2001</mid0>
    <mid1>2002</mid1>
    <nme>CarLink: ${deviceNames} Trigger</nme>
    <State sr="con0" ve="2">
      <code>3</code>
      <Str sr="arg0" ve="3">${deviceNames}</Str>
      <Str sr="arg1" ve="3"/>
    </State>
  </Profile>

  <!-- Enter Task: Connect Delay (${settings.connectDelaySeconds}s) -> Hotspot ON -->
  <Task sr="task2001">
    <cdate>1710000000000</cdate>
    <edate>1710000000000</edate>
    <id>2001</id>
    <nme>Car Connected -> Hotspot ON</nme>
    <pri>100</pri>
    <!-- Abort exit task if running (cancel 5m turn-off) -->
    <Action sr="act0" ve="7">
      <code>137</code>
      <Int sr="arg0" val="0"/>
      <Str sr="arg1" ve="3">Car Disconnected -> Hotspot OFF</Str>
    </Action>
    <!-- Wait ${settings.connectDelaySeconds} Seconds -->
    <Action sr="act1" ve="7">
      <code>30</code>
      <Int sr="arg0" val="0"/>
      <Int sr="arg1" val="${settings.connectDelaySeconds}"/>
      <Int sr="arg2" val="0"/>
      <Int sr="arg3" val="0"/>
      <Int sr="arg4" val="0"/>
    </Action>
    <!-- Set Wi-Fi Tethering (Hotspot) ON -->
    <Action sr="act2" ve="7">
      <code>113</code>
      <Int sr="arg0" val="1"/>
    </Action>
    <!-- Notify user -->
    <Action sr="act3" ve="7">
      <code>523</code>
      <Str sr="arg0" ve="3">CarLink Hotspot</Str>
      <Str sr="arg1" ve="3">Car connected (${deviceNames}). Wi-Fi Hotspot active.</Str>
      <Str sr="arg10" ve="3"/>
      <Int sr="arg2" val="0"/>
    </Action>
  </Task>

  <!-- Exit Task: Disconnect Delay (${settings.disconnectDelayMinutes}m) -> Hotspot OFF -->
  <Task sr="task2002">
    <cdate>1710000000000</cdate>
    <edate>1710000000000</edate>
    <id>2002</id>
    <nme>Car Disconnected -> Hotspot OFF</nme>
    <pri>100</pri>
    <!-- Wait ${settings.disconnectDelayMinutes} Minutes -->
    <Action sr="act0" ve="7">
      <code>30</code>
      <Int sr="arg0" val="0"/>
      <Int sr="arg1" val="0"/>
      <Int sr="arg2" val="${settings.disconnectDelayMinutes}"/>
      <Int sr="arg3" val="0"/>
      <Int sr="arg4" val="0"/>
    </Action>
    <!-- Set Wi-Fi Tethering (Hotspot) OFF -->
    <Action sr="act1" ve="7">
      <code>113</code>
      <Int sr="arg0" val="0"/>
    </Action>
    <!-- Notify user -->
    <Action sr="act2" ve="7">
      <code>523</code>
      <Str sr="arg0" ve="3">CarLink Hotspot</Str>
      <Str sr="arg1" ve="3">Car disconnected for ${settings.disconnectDelayMinutes}m. Hotspot turned off.</Str>
      <Str sr="arg10" ve="3"/>
      <Int sr="arg2" val="0"/>
    </Action>
  </Task>
</TaskerData>`;

  return xml;
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
