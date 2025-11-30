import { test, expect } from '@playwright/test';

const waitForAppShell = async (page: any) => {
  await expect(page).toHaveTitle(/MediDiario/);
  await expect(page.locator('body')).toBeVisible();
};

test('renders landing shell and opens patient modal', async ({ page }) => {
  await page.goto('/');
  await waitForAppShell(page);

  await page.getByRole('button', { name: /Nuevo Ingreso/i }).click();
  await expect(page.getByText('Nuevo Ingreso')).toBeVisible();
  await expect(page.getByText('Guardar Ficha')).toBeVisible();
});

test('navigates to settings and toggles theme', async ({ page }) => {
  await page.goto('/');
  await waitForAppShell(page);

  await page.getByRole('button', { name: /Configuración/i }).click();
  await expect(page.getByText('Configuración')).toBeVisible();

  const toggle = page.getByRole('button', { name: /Modo Oscuro/ });
  const initialClass = await toggle.getAttribute('class');
  await toggle.click();
  const updatedClass = await toggle.getAttribute('class');
  expect(initialClass).not.toEqual(updatedClass);
});
