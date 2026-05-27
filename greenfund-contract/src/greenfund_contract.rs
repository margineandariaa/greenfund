#![no_std]

#[allow(unused_imports)]
use multiversx_sc::imports::*;

#[multiversx_sc::contract]
pub trait GreenfundContract {

    // ===== INIT =====
    // Rulează o singură dată când deployezi contractul
    #[init]
    fn init(&self, target: BigUint, deadline: u64) {
        self.target().set(target);
        self.deadline().set(deadline);
    }

    #[upgrade]
    fn upgrade(&self) {}

    // ===== DONEAZĂ =====
    // Oricine poate trimite EGLD la acest endpoint
    #[payable("EGLD")]
    #[endpoint]
    fn fund(&self) {
        let payment = self.call_value().egld_value().clone_value();
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();
        let deadline = self.deadline().get();

        require!(current_time < deadline, "Campania a expirat");
        require!(payment > 0, "Trebuie sa donezi mai mult de 0");

        let mut donated = self.donations(&caller).get();
        donated += &payment;
        self.donations(&caller).set(donated);

        let mut total = self.total_funds().get();
        total += &payment;
        self.total_funds().set(total);
    }

    // ===== CLAIM =====
    // Owner-ul ia banii daca targetul e atins
    #[endpoint]
    fn claim(&self) {
        let caller = self.blockchain().get_caller();
        let owner = self.blockchain().get_owner_address();
        let current_time = self.blockchain().get_block_timestamp();
        let deadline = self.deadline().get();
        let target = self.target().get();
        let total = self.total_funds().get();

        require!(caller == owner, "Doar owner-ul poate lua banii");
        require!(current_time > deadline, "Campania inca e activa");
        require!(total >= target, "Targetul nu a fost atins");

        self.send().direct_egld(&caller, &total);
        self.total_funds().set(BigUint::zero());
    }

    // ===== REFUND =====
    // Donatorii isi recupereaza banii daca targetul nu e atins
    #[endpoint]
    fn refund(&self) {
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();
        let deadline = self.deadline().get();
        let target = self.target().get();
        let total = self.total_funds().get();

        require!(current_time > deadline, "Campania inca e activa");
        require!(total < target, "Targetul a fost atins, nu se returneaza");

        let donated = self.donations(&caller).get();
        require!(donated > 0u64, "Nu ai donat nimic");

        self.donations(&caller).set(BigUint::zero());
        self.send().direct_egld(&caller, &donated);
    }

    // ===== VIEW =====
    // Functii de citire a datelor (nu costa gas)
    #[view(getTarget)]
    fn get_target(&self) -> BigUint {
        self.target().get()
    }

    #[view(getDeadline)]
    fn get_deadline(&self) -> u64 {
        self.deadline().get()
    }

    #[view(getTotalFunds)]
    fn get_total_funds(&self) -> BigUint {
        self.total_funds().get()
    }

    #[view(getDonation)]
    fn get_donation(&self, donor: ManagedAddress) -> BigUint {
        self.donations(&donor).get()
    }

    // ===== STORAGE =====
    // Aici se definesc variabilele salvate pe blockchain
    #[storage_mapper("target")]
    fn target(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("deadline")]
    fn deadline(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("totalFunds")]
    fn total_funds(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("donations")]
    fn donations(&self, donor: &ManagedAddress) -> SingleValueMapper<BigUint>;
}