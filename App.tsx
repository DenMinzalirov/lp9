import React, { useEffect, useState } from 'react';
import './App.css';
import RegistrationModal from './components/RegistrationModal';
import { initAppAndGetActiveDomain } from 'apuesta-cloud-landing-utils';

interface BonusData {
  amount: number;
  currency: string;
  bonus: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [bonusLog, setBonusLog] = useState<string[]>([]);
  console.log(bonusLog);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [domainData, setDomainData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleBonusClaimed = (event: CustomEvent<BonusData>) => {
      const { amount, currency, bonus, timestamp } = event.detail;
      const logMessage = `🎉 Бонус получен: ${amount} ${currency} + ${bonus} в ${new Date(timestamp).toLocaleString('ru-RU')}`;
      
      setBonusLog(prev => [...prev, logMessage]);
      console.log('🎯 Бонус получен из игрового приложения:', event.detail);
      
      // Показываем модальное окно регистрации при получении бонуса
      setShowRegistrationModal(true);
    };

    // Добавляем обработчик кастомного события
    window.addEventListener('bonusClaimed', handleBonusClaimed as EventListener);
    
    return () => {
      window.removeEventListener('bonusClaimed', handleBonusClaimed as EventListener);
    };
  }, []);

  useEffect(() => {
    const dispatchBonus = () => {
      const balanceEl = document.getElementById('balance');
      const multiplierEl = document.getElementById('modal-multiplier');

      const amount = balanceEl ? Number((balanceEl.textContent || '0').replace(/[^0-9.]/g, '')) : 0;
      const multiplier = multiplierEl ? (multiplierEl.textContent || '').trim() : '';

      const bonusDetail: BonusData = {
        amount: isNaN(amount) ? 0 : amount,
        currency: '€',
        bonus: multiplier ? `${multiplier}X` : '0X',
        timestamp: new Date().toISOString(),
      };

      window.dispatchEvent(new CustomEvent<BonusData>('bonusClaimed', { detail: bonusDetail }));
      setShowRegistrationModal(true);
    };

    const handleDelegatedClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const buttonEl = (target as any).closest ? (target as HTMLElement).closest('#win-button-modal') : null;
      const popupBtnEl = (target as any).closest ? (target as HTMLElement).closest('a.popup__btn_finished') : null;
      if (buttonEl || popupBtnEl) {
        event.preventDefault?.();
        event.stopPropagation?.();
        dispatchBonus();
      }
    };

    const handleDirectButtonClick = (event: Event) => {
      event.preventDefault?.();
      dispatchBonus();
    };

    const handleAnchorClick = (event: Event) => {
      // Перехватываем переход по ссылке-обёртке
      event.preventDefault?.();
      dispatchBonus();
    };

    const handlePopupButtonClick = (event: Event) => {
      // Перехватываем переход по кнопке Claim bonus
      event.preventDefault?.();
      dispatchBonus();
    };

    // Делегированный обработчик — срабатывает даже при динамической подмене кнопки
    document.addEventListener('click', handleDelegatedClick as EventListener, true);

    // Прямые обработчики, если элементы уже есть
    const button = document.getElementById('win-button-modal');
    const anchor = document.getElementById('install_button');
    const popupBtn = document.querySelector('a.popup__btn_finished');
    if (button) button.addEventListener('click', handleDirectButtonClick as EventListener);
    if (anchor) anchor.addEventListener('click', handleAnchorClick as EventListener);
    if (popupBtn) popupBtn.addEventListener('click', handlePopupButtonClick as EventListener);

    return () => {
      document.removeEventListener('click', handleDelegatedClick as EventListener, true);
      if (button) button.removeEventListener('click', handleDirectButtonClick as EventListener);
      if (anchor) anchor.removeEventListener('click', handleAnchorClick as EventListener);
      if (popupBtn) popupBtn.removeEventListener('click', handlePopupButtonClick as EventListener);
    };
  }, []);

  // Инициализация домена при загрузке
  useEffect(() => {
    const initializeDomain = async () => {
      const initStartTime = new Date().toISOString();
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Инициализируем домен с реальными параметрами от Apuesta.cloud
        const response = await initAppAndGetActiveDomain(
          'https://htzbtz.cc', // redirectorOrigin
          '686a47af' // redirectorCampaignId
        );
        
        const initEndTime = new Date().toISOString();
        const initDuration = new Date(initEndTime).getTime() - new Date(initStartTime).getTime();
        
        setDomainData(response);
      } catch (err) {
        console.log({err});
        setError(err instanceof Error ? err.message : 'Ошибка инициализации домена');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDomain();
  }, []);

  return (
    <div className="App">
      {/* Модальное окно регистрации */}
      {showRegistrationModal && (
        <RegistrationModal
          onClose={() => setShowRegistrationModal(false)}
          domainData={domainData}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
};

export default App;
