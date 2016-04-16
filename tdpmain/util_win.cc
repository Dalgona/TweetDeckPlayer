// Copyright (c) 2015 The Chromium Embedded Framework Authors. All rights
// reserved. Use of this source code is governed by a BSD-style license that
// can be found in the LICENSE file.

#include "tdpmain/util_win.h"

#include "include/base/cef_logging.h"

namespace tdpmain {

void SetUserDataPtr(HWND hWnd, void* ptr) {
  SetLastError(ERROR_SUCCESS);
  LONG_PTR result = ::SetWindowLongPtr(
      hWnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(ptr));
  CHECK(result != 0 || GetLastError() == ERROR_SUCCESS);
}

WNDPROC SetWndProcPtr(HWND hWnd, WNDPROC wndProc) {
  WNDPROC old =
      reinterpret_cast<WNDPROC>(::GetWindowLongPtr(hWnd, GWLP_WNDPROC));
  CHECK(old != NULL);
  LONG_PTR result = ::SetWindowLongPtr(
      hWnd, GWLP_WNDPROC, reinterpret_cast<LONG_PTR>(wndProc));
  CHECK(result != 0 || GetLastError() == ERROR_SUCCESS);
  return old;
}

std::wstring GetResourceString(UINT id) {
  #define MAX_LOADSTRING 100
  TCHAR buff[MAX_LOADSTRING] = {0};
  LoadString(::GetModuleHandle(NULL), id, buff, MAX_LOADSTRING);
  return buff;
}

int GetCefMouseModifiers(WPARAM wparam) {
  int modifiers = 0;
  if (wparam & MK_CONTROL)
    modifiers |= EVENTFLAG_CONTROL_DOWN;
  if (wparam & MK_SHIFT)
    modifiers |= EVENTFLAG_SHIFT_DOWN;
  if (IsKeyDown(VK_MENU))
    modifiers |= EVENTFLAG_ALT_DOWN;
  if (wparam & MK_LBUTTON)
    modifiers |= EVENTFLAG_LEFT_MOUSE_BUTTON;
  if (wparam & MK_MBUTTON)
    modifiers |= EVENTFLAG_MIDDLE_MOUSE_BUTTON;
  if (wparam & MK_RBUTTON)
    modifiers |= EVENTFLAG_RIGHT_MOUSE_BUTTON;

  // Low bit set from GetKeyState indicates "toggled".
  if (::GetKeyState(VK_NUMLOCK) & 1)
    modifiers |= EVENTFLAG_NUM_LOCK_ON;
  if (::GetKeyState(VK_CAPITAL) & 1)
    modifiers |= EVENTFLAG_CAPS_LOCK_ON;
  return modifiers;
}

int GetCefKeyboardModifiers(WPARAM wparam, LPARAM lparam) {
  int modifiers = 0;
  if (IsKeyDown(VK_SHIFT))
    modifiers |= EVENTFLAG_SHIFT_DOWN;
  if (IsKeyDown(VK_CONTROL))
    modifiers |= EVENTFLAG_CONTROL_DOWN;
  if (IsKeyDown(VK_MENU))
    modifiers |= EVENTFLAG_ALT_DOWN;

  // Low bit set from GetKeyState indicates "toggled".
  if (::GetKeyState(VK_NUMLOCK) & 1)
    modifiers |= EVENTFLAG_NUM_LOCK_ON;
  if (::GetKeyState(VK_CAPITAL) & 1)
    modifiers |= EVENTFLAG_CAPS_LOCK_ON;

  switch (wparam) {
  case VK_RETURN:
    if ((lparam >> 16) & KF_EXTENDED)
      modifiers |= EVENTFLAG_IS_KEY_PAD;
    break;
  case VK_INSERT:
  case VK_DELETE:
  case VK_HOME:
  case VK_END:
  case VK_PRIOR:
  case VK_NEXT:
  case VK_UP:
  case VK_DOWN:
  case VK_LEFT:
  case VK_RIGHT:
    if (!((lparam >> 16) & KF_EXTENDED))
      modifiers |= EVENTFLAG_IS_KEY_PAD;
    break;
  case VK_NUMLOCK:
  case VK_NUMPAD0:
  case VK_NUMPAD1:
  case VK_NUMPAD2:
  case VK_NUMPAD3:
  case VK_NUMPAD4:
  case VK_NUMPAD5:
  case VK_NUMPAD6:
  case VK_NUMPAD7:
  case VK_NUMPAD8:
  case VK_NUMPAD9:
  case VK_DIVIDE:
  case VK_MULTIPLY:
  case VK_SUBTRACT:
  case VK_ADD:
  case VK_DECIMAL:
  case VK_CLEAR:
    modifiers |= EVENTFLAG_IS_KEY_PAD;
    break;
  case VK_SHIFT:
    if (IsKeyDown(VK_LSHIFT))
      modifiers |= EVENTFLAG_IS_LEFT;
    else if (IsKeyDown(VK_RSHIFT))
      modifiers |= EVENTFLAG_IS_RIGHT;
    break;
  case VK_CONTROL:
    if (IsKeyDown(VK_LCONTROL))
      modifiers |= EVENTFLAG_IS_LEFT;
    else if (IsKeyDown(VK_RCONTROL))
      modifiers |= EVENTFLAG_IS_RIGHT;
    break;
  case VK_MENU:
    if (IsKeyDown(VK_LMENU))
      modifiers |= EVENTFLAG_IS_LEFT;
    else if (IsKeyDown(VK_RMENU))
      modifiers |= EVENTFLAG_IS_RIGHT;
    break;
  case VK_LWIN:
    modifiers |= EVENTFLAG_IS_LEFT;
    break;
  case VK_RWIN:
    modifiers |= EVENTFLAG_IS_RIGHT;
    break;
  }
  return modifiers;
}

bool IsKeyDown(WPARAM wparam) {
  return (GetKeyState(wparam) & 0x8000) != 0;
}

float GetDeviceScaleFactor() {
  static float scale_factor = 1.0;
  static bool initialized = false;

  if (!initialized) {
    // This value is safe to cache for the life time of the app since the user
    // must logout to change the DPI setting. This value also applies to all
    // screens.
    HDC screen_dc = ::GetDC(NULL);
    int dpi_x = GetDeviceCaps(screen_dc, LOGPIXELSX);
    scale_factor = static_cast<float>(dpi_x) / 96.0f;
    ::ReleaseDC(NULL, screen_dc);
    initialized = true;
  }

  return scale_factor;
}

// Get path to TweetDeck Player Execute file
std::wstring GetExePath() {
	wchar_t p[MAX_PATH];
	int len;
	GetModuleFileName(0, p, MAX_PATH);
	for (len = wcslen(p) - 1; p[len] != L'\\'; len--);
	p[len] = 0;
	return p;
}

std::wstring GetINIPath() {
	return GetExePath() + L"\\appdata.ini";
}

std::wstring GetDataPath() {
	return GetExePath() + L"\\data";
}

void SaveAppData(HWND hWnd) {
	DWORD dwStyle;
	RECT rect;

	// save prevent when window minimize or maximize
	dwStyle = GetWindowLong(hWnd, GWL_STYLE);
	if (dwStyle & WS_MINIMIZE || dwStyle & WS_MAXIMIZE)
		return;

	GetWindowRect(hWnd, &rect);
	const std::wstring iniPath(GetINIPath());

	SetINI_String(L"window", L"left", std::to_wstring(rect.left));
	SetINI_String(L"window", L"right", std::to_wstring(rect.right));
	SetINI_String(L"window", L"top", std::to_wstring(rect.top));
	SetINI_String(L"window", L"bottom", std::to_wstring(rect.bottom));
}

std::wstring GetINI_String(std::wstring app, std::wstring key, std::wstring default)
{
	wchar_t buf[501];
	const std::wstring iniPath(GetINIPath());
	GetPrivateProfileString(app.c_str(), key.c_str(), default.c_str(), buf, 500, iniPath.c_str());
	return buf;
}
void SetINI_String(std::wstring app, std::wstring key, std::wstring string)
{
	const std::wstring iniPath(GetINIPath());
	WritePrivateProfileString(app.c_str(), key.c_str(), string.c_str(), iniPath.c_str());
}
int GetINI_Int(std::wstring app, std::wstring key, int default)
{
	const std::wstring iniPath(GetINIPath());
	return GetPrivateProfileInt(app.c_str(), key.c_str(), default, iniPath.c_str());
}
void SetINI_Int(std::wstring app, std::wstring key, int value)
{
	const std::wstring iniPath(GetINIPath());
	WritePrivateProfileString(app.c_str(), key.c_str(), std::to_wstring(value).c_str(), iniPath.c_str());
}
void OpenURL(CefString url)
{
	ShellExecute(NULL, L"open", url.c_str(), 0, 0, SW_SHOWNORMAL);
}
std::string GetDownloadPath(const std::string& file_name) {
	TCHAR szFolderPath[MAX_PATH];
	std::string path;

	// Save the file in the user's "My Documents" folder.
	if (SUCCEEDED(SHGetFolderPath(NULL, CSIDL_PERSONAL | CSIDL_FLAG_CREATE,
		NULL, 0, szFolderPath))) {
		path = CefString(szFolderPath);
		path += "\\" + file_name;
	}

	return path;
}
std::string PartialEraseStr(const std::string &a, const std::string &b)
{
	if (a.length() <= b.length()) return a;
	if (!a.substr(a.length() - b.length(), b.length()).compare(b))
		return a.substr(0, a.length() - b.length());
	else return a;
}
std::wstring PartialEraseStr(const std::wstring &a, const std::wstring &b)
{
	if (a.length() <= b.length()) return a;
	if (!a.substr(a.length() - b.length(), b.length()).compare(b))
		return a.substr(0, a.length() - b.length());
	else return a;
}
std::wstring Twimg_Larger(const std::wstring &url)
{
	std::wstring sourceUrl = url;
	bool twimg_larger = (GetINI_Int(L"setting", L"DisableTwimgToLarger", 0) == 1);
	SetINI_Int(L"setting", L"DisableTwimgToLarger", twimg_larger);
	if (!twimg_larger)
	{
		if (sourceUrl.find(L"twimg.com/media", 0) != std::wstring::npos)
		{
			sourceUrl = PartialEraseStr(sourceUrl, L":large");
			sourceUrl = PartialEraseStr(sourceUrl, L":normal");
			sourceUrl = PartialEraseStr(sourceUrl, L":small");
			sourceUrl += L":large";
		}
	}
	return sourceUrl;
}
}